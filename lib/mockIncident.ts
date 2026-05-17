import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join } from "path";
import type { AgentKey, IncidentBundle, IncidentMeta, LogFile, RawTimelineEvent } from "./types/investigation";

export const DEFAULT_SCENARIO_ID = "supply-chain-attack";

const AGENT_FACING_FILES = [
  "incident.json",
  "authEvents.json",
  "secretsEvents.json",
  "githubEvents.json",
  "cicdEvents.json",
  "networkEvents.json",
  "threatIntel.json",
  "packageManifests.json",
] as const;

function incidentDataDir(scenarioId: string): string {
  return join(process.cwd(), "data", "incidents", scenarioId);
}

function readJson<T>(filePath: string): T {
  if (!existsSync(filePath)) {
    throw new Error(`Mock incident file not found: ${filePath}`);
  }
  return JSON.parse(readFileSync(filePath, "utf-8")) as T;
}

/** Load all agent-facing JSON logs from `data/incidents/{scenarioId}/`. */
export function loadIncidentBundle(
  scenarioId: string = DEFAULT_SCENARIO_ID,
): IncidentBundle {
  const basePath = incidentDataDir(scenarioId);
  if (!existsSync(basePath)) {
    throw new Error(`Incident scenario directory not found: ${basePath}`);
  }

  const incident = readJson<IncidentMeta>(join(basePath, "incident.json"));

  return {
    scenarioId,
    basePath,
    incident,
    authEvents: readJson(join(basePath, "authEvents.json")),
    secretsEvents: readJson(join(basePath, "secretsEvents.json")),
    githubEvents: readJson(join(basePath, "githubEvents.json")),
    cicdEvents: readJson(join(basePath, "cicdEvents.json")),
    networkEvents: readJson(join(basePath, "networkEvents.json")),
    threatIntel: readJson(join(basePath, "threatIntel.json")),
    packageManifests: readJson(join(basePath, "packageManifests.json")),
  };
}

function inInvestigationWindow(
  timestamp: string,
  window: IncidentMeta["investigationWindow"],
): boolean {
  return timestamp >= window.from && timestamp <= window.to;
}

function filterByWindow<T extends { timestamp: string }>(
  events: T[],
  window: IncidentMeta["investigationWindow"],
): T[] {
  return events.filter((e) => inInvestigationWindow(e.timestamp, window));
}

/** Prioritize high-volume flows; cap noise for token limits while keeping anomalies. */
function prepareNetworkEvents(
  network: LogFile<Record<string, unknown>>,
  window: IncidentMeta["investigationWindow"],
  maxSampledSmallFlows = 40,
): Record<string, unknown> {
  const events = (network.events ?? []) as Array<Record<string, unknown> & { timestamp: string; bytesOut?: number }>;
  const inWindow = filterByWindow(events, window);
  const large = inWindow.filter((e) => (e.bytesOut as number) >= 50_000_000);
  const small = inWindow
    .filter((e) => (e.bytesOut as number) < 50_000_000)
    .sort((a, b) => (b.bytesOut as number) - (a.bytesOut as number))
    .slice(0, maxSampledSmallFlows);

  const selected = [...large, ...small].sort((a, b) =>
    String(a.timestamp).localeCompare(String(b.timestamp)),
  );

  return {
    source: network.source,
    baseline: network.baseline,
    investigationWindow: window,
    selectionNote:
      "Includes all flows >= 50MB in window plus top sampled smaller flows. Full export has more records.",
    recordCount: selected.length,
    totalInWindow: inWindow.length,
    events: selected,
  };
}

/** Build the evidence payload for a single agent from raw log files (no pre-labeled alerts). */
export function getEvidenceForAgent(
  agent: AgentKey,
  bundle: IncidentBundle,
): Record<string, unknown> {
  const { incident, investigationWindow } = {
    incident: bundle.incident,
    investigationWindow: bundle.incident.investigationWindow,
  };

  const authInWindow = filterByWindow(
    (bundle.authEvents.events ?? []) as Array<{ timestamp: string }>,
    investigationWindow,
  );
  const secretsInWindow = filterByWindow(
    (bundle.secretsEvents.events ?? []) as Array<{ timestamp: string }>,
    investigationWindow,
  );
  const githubInWindow = filterByWindow(
    (bundle.githubEvents.events ?? []) as Array<{ timestamp: string }>,
    investigationWindow,
  );
  const cicdInWindow = filterByWindow(
    (bundle.cicdEvents.events ?? []) as Array<{ timestamp: string }>,
    investigationWindow,
  );

  switch (agent) {
    case "intake":
      return {
        incident,
        investigationWindow,
        dataSources: AGENT_FACING_FILES,
        authEvents: {
          source: bundle.authEvents.source,
          recordCount: authInWindow.length,
          events: authInWindow,
        },
        secretsEvents: {
          source: bundle.secretsEvents.source,
          recordCount: secretsInWindow.length,
          events: secretsInWindow,
        },
        githubEvents: {
          source: bundle.githubEvents.source,
          recordCount: githubInWindow.length,
          events: githubInWindow,
        },
        cicdEvents: {
          source: bundle.cicdEvents.source,
          recordCount: cicdInWindow.length,
          events: cicdInWindow,
        },
        networkEvents: prepareNetworkEvents(bundle.networkEvents, investigationWindow),
        threatIntel: {
          source: bundle.threatIntel.source,
          indicatorCount: (bundle.threatIntel.indicators as unknown[])?.length ?? 0,
          indicators: bundle.threatIntel.indicators,
        },
      };

    case "auth":
      return {
        incident: { organization: incident.organization, investigationWindow },
        authEvents: { ...bundle.authEvents, events: authInWindow, recordCount: authInWindow.length },
        secretsEvents: {
          ...bundle.secretsEvents,
          events: secretsInWindow,
          recordCount: secretsInWindow.length,
        },
      };

    case "code":
      return {
        incident: { organization: incident.organization, investigationWindow, repositories: incident.repositories },
        githubEvents: { ...bundle.githubEvents, events: githubInWindow, recordCount: githubInWindow.length },
        cicdEvents: { ...bundle.cicdEvents, events: cicdInWindow, recordCount: cicdInWindow.length },
        packageManifests: bundle.packageManifests,
      };

    case "network":
      return {
        incident: { organization: incident.organization, investigationWindow, productionHosts: incident.productionHosts },
        networkEvents: prepareNetworkEvents(bundle.networkEvents, investigationWindow),
        threatIntel: bundle.threatIntel,
      };

    case "master":
    case "remediation":
      return { incident };

    default:
      return { incident };
  }
}

export function listScenarioIds(): string[] {
  const root = join(process.cwd(), "data", "incidents");
  if (!existsSync(root)) return [];
  return readdirSync(root).filter((name) => statSync(join(root, name)).isDirectory());
}

function shortTime(timestamp: string): string {
  return timestamp.slice(11, 19);
}

function findById<T extends { id?: string }>(events: T[] | undefined, id: string): T | undefined {
  return events?.find((event) => event.id === id);
}

function formatGb(bytes: number): string {
  return `${(bytes / 1024 ** 3).toFixed(1)}GB`;
}

function addedDependencies(bundle: IncidentBundle): string[] {
  const snapshots = bundle.packageManifests.snapshots as
    | Array<{ "package.json"?: { dependencies?: Record<string, string> } }>
    | undefined;
  const before = snapshots?.[0]?.["package.json"]?.dependencies ?? {};
  const after = snapshots?.[1]?.["package.json"]?.dependencies ?? {};
  return Object.keys(after).filter((name) => !before[name]);
}

/** Raw scenario timeline shown in the UI. This is source evidence, not generated findings. */
export function getRawTimelineEvents(
  scenarioId: string = DEFAULT_SCENARIO_ID,
): RawTimelineEvent[] {
  const bundle = loadIncidentBundle(scenarioId);
  const authEvent = findById(bundle.authEvents.events, "okta-ev-31847");
  const secretEvent = findById(bundle.secretsEvents.events, "vault-audit-29401");
  const githubEvent = findById(bundle.githubEvents.events, "gh-48291");
  const cicdEvent = findById(bundle.cicdEvents.events, "gha-91024");
  const networkEvents = (bundle.networkEvents.events ?? []) as Array<
    Record<string, unknown> & { timestamp: string; bytesOut?: number; dstAddr?: string }
  >;
  const networkEvent = networkEvents
    .filter((event) => typeof event.bytesOut === "number")
    .sort((a, b) => (b.bytesOut ?? 0) - (a.bytesOut ?? 0))[0];
  const dependency = addedDependencies(bundle)[0] ?? "new dependency";

  const events: RawTimelineEvent[] = [];
  if (authEvent) {
    const actor = authEvent.actor as { email?: string } | undefined;
    const client = authEvent.client as
      | {
          ipAddress?: string;
          device?: string;
          geographicalContext?: { city?: string };
        }
      | undefined;
    events.push({
      id: String(authEvent.id),
      time: shortTime(authEvent.timestamp as string),
      source: "Auth",
      text: `Login from ${client?.geographicalContext?.city ?? "unknown location"} for ${actor?.email ?? "developer"} (${client?.ipAddress ?? "unknown IP"}) on ${client?.device ?? "unknown device"}`,
      severity: "HIGH",
      raw: authEvent as Record<string, unknown>,
      linkedAgent: "Auth Agent",
      correlationTags: ["same user/IP", "credential theft", "MFA passed"],
    });
  }
  if (secretEvent) {
    const secret = secretEvent.secret as { name?: string } | undefined;
    const request = secretEvent.request as { remoteAddress?: string } | undefined;
    events.push({
      id: String(secretEvent.id),
      time: shortTime(secretEvent.timestamp as string),
      source: "Secrets",
      text: `${secret?.name ?? "Production secret"} accessed${request?.remoteAddress ? ` from ${request.remoteAddress}` : ""}`,
      severity: "HIGH",
      raw: secretEvent as Record<string, unknown>,
      linkedAgent: "Auth Agent",
      correlationTags: ["same user/IP", "secret access", "temporal proximity"],
    });
  }
  if (githubEvent) {
    const payload = githubEvent.payload as
      | { commits?: Array<{ sha?: string; message?: string }> }
      | undefined;
    const commit = payload?.commits?.[0];
    events.push({
      id: String(githubEvent.id),
      time: shortTime(githubEvent.timestamp as string),
      source: "GitHub",
      text: `Commit ${commit?.sha ?? "unknown"} adds dependency ${dependency}`,
      severity: "CRITICAL",
      raw: githubEvent as Record<string, unknown>,
      linkedAgent: "Code Agent",
      correlationTags: ["dependency change", "same developer", "typosquat"],
    });
  }
  if (cicdEvent) {
    events.push({
      id: String(cicdEvent.id),
      time: shortTime(cicdEvent.timestamp as string),
      source: "CI/CD",
      text: `${String(cicdEvent.workflow ?? "deployment")} workflow completed ${String(cicdEvent.conclusion ?? "unknown")}`,
      severity: "HIGH",
      raw: cicdEvent as Record<string, unknown>,
      linkedAgent: "Code Agent",
      correlationTags: ["deployed after commit", "production deploy"],
    });
  }
  if (networkEvent) {
    events.push({
      id: String(networkEvent.id),
      time: shortTime(networkEvent.timestamp),
      source: "Network",
      text: `${formatGb(networkEvent.bytesOut ?? 0)} outbound HTTPS to ${networkEvent.dstAddr ?? "unknown destination"}`,
      severity: "CRITICAL",
      raw: networkEvent,
      linkedAgent: "Network Agent",
      correlationTags: ["egress after deploy", "unapproved destination", "volume anomaly"],
    });
  }

  return events.sort((a, b) => a.time.localeCompare(b.time));
}
