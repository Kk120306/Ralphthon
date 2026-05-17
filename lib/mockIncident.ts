import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join } from "path";
import type { AgentKey, IncidentBundle, IncidentMeta, LogFile } from "./types/investigation";

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
