import {
  buildAgentPrompt,
  buildMasterPrompt,
  buildRemediationPrompt,
} from "./agentPrompts";
import { getFallbackInvestigation } from "./fallbackInvestigation";
import {
  DEFAULT_SCENARIO_ID,
  getEvidenceForAgent,
  loadIncidentBundle,
} from "./mockIncident";
import type {
  AgentFinding,
  AgentKey,
  InvestigationResponse,
  MitreMapping,
  MockPrResult,
  SpecialistAgent,
} from "./types/investigation";

const AGENT_ORDER: AgentKey[] = [
  "intake",
  "auth",
  "code",
  "network",
  "master",
  "remediation",
];

const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

const REQUIRED_ATTACK_CHAIN = [
  "Credential Theft",
  "Secret Access",
  "Malicious Dependency",
  "Data Exfiltration",
];

const REQUIRED_MITRE_IDS = ["T1078", "T1552", "T1195", "T1041"];


async function callOpenAI(system: string, user: string): Promise<Record<string, unknown>> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty OpenAI response");
  }

  return JSON.parse(content) as Record<string, unknown>;
}


function fail(field: string): never {
  throw new Error(`OpenAI response missing or invalid field: ${field}`);
}

function requireString(value: unknown, field: string): string {
  if (typeof value === "string" && value.trim().length > 0) return value;
  return fail(field);
}

function normalizeNumber(value: unknown, field: string): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace("%", "").trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return fail(field);
}

function normalizeOptionalNumber(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return normalizeNumber(value, field);
}

function normalizeRequiredDisplayList(value: unknown, field: string): string[] {
  const normalized = normalizeDisplayList(value);
  if (normalized?.length) return normalized;
  return fail(field);
}

function normalizeOptionalDisplayList(value: unknown): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  return normalizeDisplayList(value);
}

function normalizeTimeline(
  value: unknown,
  field: string,
): InvestigationResponse["finalReport"]["timeline"] {
  if (!Array.isArray(value) || value.length === 0) return fail(field);

  return value.map((item, index) => {
    const record = item as Record<string, unknown>;
    return {
      time: requireString(record.time ?? record.timestamp, `${field}[${index}].time`),
      event: requireString(record.event ?? record.description, `${field}[${index}].event`),
      source: typeof record.source === "string" && record.source.trim() ? record.source : undefined,
    };
  });
}

function normalizeAttackChain(value: unknown): string[] {
  const chain = normalizeRequiredDisplayList(value, "master.attackChain");
  const lowerChain = chain.map((item) => item.toLowerCase());
  const missing = REQUIRED_ATTACK_CHAIN.filter(
    (required) => !lowerChain.includes(required.toLowerCase()),
  );
  if (missing.length > 0) {
    throw new Error(`OpenAI response omitted required attack chain phases: ${missing.join(", ")}`);
  }
  return chain;
}

function normalizeMitreMappings(
  value: unknown,
  field: string,
  requireRequiredIds = false,
): MitreMapping[] {
  if (!Array.isArray(value) || value.length === 0) return fail(field);

  const normalized = value
    .map((item, index) => {
      const record = item as Record<string, unknown>;
      return {
        id: requireString(record.id ?? record.techniqueId, `${field}[${index}].id`),
        name: requireString(record.name ?? record.techniqueName, `${field}[${index}].name`),
        reason:
          typeof (record.reason ?? record.rationale ?? record.description) === "string"
            ? String(record.reason ?? record.rationale ?? record.description)
            : undefined,
        tactic: typeof record.tactic === "string" ? record.tactic : undefined,
      };
    });

  if (requireRequiredIds) {
    const ids = new Set(normalized.map((item) => item.id));
    const missing = REQUIRED_MITRE_IDS.filter((id) => !ids.has(id));
    if (missing.length > 0) {
      throw new Error(`OpenAI response omitted required MITRE mappings: ${missing.join(", ")}`);
    }
  }

  return normalized;
}

function normalizeOptionalMitreMappings(value: unknown, field: string): MitreMapping[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value) && value.length === 0) return undefined;
  if (!Array.isArray(value)) return undefined;

  const normalized: MitreMapping[] = [];
  for (const item of value) {
    const record = item as Record<string, unknown>;
    const id = record.id ?? record.techniqueId;
    const name = record.name ?? record.techniqueName;
    if (typeof id !== "string" || typeof name !== "string") continue;
    normalized.push({
      id,
      name,
      reason:
        typeof (record.reason ?? record.rationale ?? record.description) === "string"
          ? String(record.reason ?? record.rationale ?? record.description)
          : undefined,
      tactic: typeof record.tactic === "string" ? record.tactic : undefined,
    });
  }

  if (value.length > 0 && normalized.length === 0) {
    console.warn(`Ignoring malformed optional MITRE mappings for ${field}`);
  }

  return normalized.length ? normalized : undefined;
}

function normalizeOpenAIFilesChanged(value: unknown): MockPrResult["filesChanged"] {
  if (!Array.isArray(value) || value.length === 0) return fail("mockPrResult.filesChanged");

  const allowed = new Set(["modified", "removed", "added"]);
  return value.map((item, index) => {
    const record = item as Record<string, unknown>;
    const rawChangeType = requireString(record.changeType, `mockPrResult.filesChanged[${index}].changeType`).toLowerCase();
    const changeType =
      rawChangeType === "changed" || rawChangeType === "updated" || rawChangeType === "modified"
        ? "modified"
        : rawChangeType === "deleted" || rawChangeType === "removed"
          ? "removed"
          : rawChangeType === "created" || rawChangeType === "added"
            ? "added"
            : rawChangeType;
    if (!allowed.has(changeType)) {
      throw new Error(`OpenAI response used unsupported file change type: ${rawChangeType}`);
    }
    return {
      path: requireString(record.path, `mockPrResult.filesChanged[${index}].path`),
      changeType: changeType as "modified" | "removed" | "added",
    };
  });
}

function normalizeOpenAIMockPrResult(value: Record<string, unknown>): MockPrResult {
  return {
    source: "openai",
    title: requireString(value.title, "mockPrResult.title"),
    summary: requireString(value.summary, "mockPrResult.summary"),
    filesChanged: normalizeOpenAIFilesChanged(value.filesChanged),
    patch: requireString(value.patch, "mockPrResult.patch"),
    riskRemovalExplanation: requireString(
      value.riskRemovalExplanation,
      "mockPrResult.riskRemovalExplanation",
    ),
    validationNotes: normalizeRequiredDisplayList(value.validationNotes, "mockPrResult.validationNotes"),
  };
}

async function generateOpenAIMockPrResult(master: Record<string, unknown>): Promise<MockPrResult> {
  const result = await callOpenAI(
    `You are IncidentIQ's remediation PR author. Return ONLY valid JSON for a mock GitHub-style PR result. Do not call GitHub APIs. The PR must remove the malicious dependency risk from lodash-utilz and include title, summary, filesChanged, patch, riskRemovalExplanation, and validationNotes. Every field must be generated from the correlated incident, not copied from a fallback template.`,
    `Create a mock remediation PR result from this correlated incident. Use source="openai" in the JSON.

${JSON.stringify(master, null, 2)}`,
  );

  return normalizeOpenAIMockPrResult(result);
}

function stringifyListItem(item: unknown): string | null {
  if (typeof item === "string") return item;
  if (typeof item === "number" || typeof item === "boolean") return String(item);
  if (item && typeof item === "object") {
    const record = item as Record<string, unknown>;
    const preferred =
      record.finding ??
      record.summary ??
      record.event ??
      record.note ??
      record.description ??
      record.reason;
    if (typeof preferred === "string") return preferred;
    try {
      return JSON.stringify(item);
    } catch {
      return String(item);
    }
  }
  return null;
}

function normalizeDisplayList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const normalized = value
    .map(stringifyListItem)
    .filter((item): item is string => Boolean(item && item.trim().length > 0));
  return normalized.length ? normalized : undefined;
}

function toAgentFinding(
  raw: Record<string, unknown>,
  agent: AgentFinding["agent"],
  key: AgentKey,
): AgentFinding {
  return {
    agent,
    status: "complete",
    summary: requireString(raw.summary, `${key}.summary`),
    severity: raw.severity as string | undefined,
    confidence: normalizeOptionalNumber(raw.confidence, `${key}.confidence`),
    keyFindings: normalizeOptionalDisplayList(raw.keyFindings),
    mitreMappings: normalizeOptionalMitreMappings(raw.mitreMappings, `${key}.mitreMappings`),
    riskContribution: normalizeOptionalNumber(raw.riskContribution, `${key}.riskContribution`),
    rootCause: typeof raw.rootCause === "string" ? raw.rootCause : undefined,
    attackChain: normalizeOptionalDisplayList(raw.attackChain),
    timeline: raw.timeline as AgentFinding["timeline"],
    riskScore: normalizeOptionalNumber(raw.riskScore, `${key}.riskScore`),
    containment: normalizeDisplayList(raw.containment),
    eradication: normalizeDisplayList(raw.eradication),
    recovery: normalizeDisplayList(raw.recovery),
    postIncident: normalizeDisplayList(raw.postIncident),
    checklist: normalizeDisplayList(raw.checklist),
  };
}

function assembleResponse(
  scenarioId: string,
  findings: Record<AgentKey, Record<string, unknown>>,
  mockPrResult: MockPrResult,
): InvestigationResponse {
  const master = findings.master;
  const remediation = findings.remediation;
  const mitreMappings = normalizeMitreMappings(master.mitreMappings, "master.mitreMappings", true);
  const remediationChecklist = normalizeRequiredDisplayList(
    remediation.checklist,
    "remediation.checklist",
  );
  const attackChain = normalizeAttackChain(master.attackChain);
  const evidenceSummary = normalizeDisplayList([
    ...((findings.intake.keyFindings as unknown[] | undefined) ?? []),
    ...((findings.auth.keyFindings as unknown[] | undefined) ?? []),
    ...((findings.code.keyFindings as unknown[] | undefined) ?? []),
    ...((findings.network.keyFindings as unknown[] | undefined) ?? []),
  ])?.slice(0, 8) ?? [];

  return {
    incidentName: requireString(master.incidentName, "master.incidentName"),
    severity: requireString(master.severity, "master.severity"),
    riskScore: normalizeNumber(master.riskScore, "master.riskScore"),
    confidence: normalizeNumber(master.confidence, "master.confidence"),
    rootCause: requireString(master.rootCause, "master.rootCause"),
    attackChain,
    agentFindings: AGENT_ORDER.map((key) =>
      toAgentFinding(findings[key], mapAgentName(key), key),
    ),
    mitreMappings,
    remediationChecklist,
    finalReport: {
      summary: requireString(master.summary, "master.summary"),
      timeline: normalizeTimeline(master.timeline, "master.timeline"),
      evidenceSummary,
      recommendedActions: remediationChecklist,
    },
    mockPrResult,
    meta: {
      dataSource: `data/incidents/${scenarioId}/`,
      scenarioId,
      usedOpenAI: true,
    },
  };
}

function mapAgentName(key: AgentKey): AgentFinding["agent"] {
  const names: Record<AgentKey, AgentFinding["agent"]> = {
    intake: "Intake Agent",
    auth: "Auth Agent",
    code: "Code Agent",
    network: "Network Agent",
    master: "Master Correlation Agent",
    remediation: "Remediation Agent",
  };
  return names[key];
}

export async function runInvestigation(
  scenarioId: string = DEFAULT_SCENARIO_ID,
): Promise<InvestigationResponse> {
  const bundle = loadIncidentBundle(scenarioId);

  if (!process.env.OPENAI_API_KEY) {
    return getFallbackInvestigation(scenarioId);
  }

  try {
    const findings = {} as Record<AgentKey, Record<string, unknown>>;
    const specialists: Partial<Record<SpecialistAgent, Record<string, unknown>>> = {};

    for (const key of ["intake", "auth", "code", "network"] as SpecialistAgent[]) {
      const evidence = getEvidenceForAgent(key, bundle);
      const { system, user } = buildAgentPrompt(key, evidence);
      findings[key] = await callOpenAI(system, user);
      specialists[key] = findings[key];
    }

    const masterEvidence = {
      incident: bundle.incident,
      specialistFindings: specialists,
    };
    const masterPrompt = buildMasterPrompt(masterEvidence, specialists);
    findings.master = await callOpenAI(masterPrompt.system, masterPrompt.user);

    const remediationPrompt = buildRemediationPrompt(findings.master);
    findings.remediation = await callOpenAI(remediationPrompt.system, remediationPrompt.user);

    const mockPrResult = await generateOpenAIMockPrResult(findings.master);
    return assembleResponse(scenarioId, findings, mockPrResult);
  } catch {
    return getFallbackInvestigation(scenarioId);
  }
}
