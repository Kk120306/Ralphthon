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

function toAgentFinding(raw: Record<string, unknown>, agent: AgentFinding["agent"]): AgentFinding {
  return {
    agent,
    status: "complete",
    summary: String(raw.summary ?? ""),
    severity: raw.severity as string | undefined,
    confidence: raw.confidence as number | undefined,
    keyFindings: raw.keyFindings as string[] | undefined,
    mitreMappings: raw.mitreMappings as AgentFinding["mitreMappings"],
    riskContribution: raw.riskContribution as number | undefined,
    rootCause: raw.rootCause as string | undefined,
    attackChain: raw.attackChain as string[] | undefined,
    timeline: raw.timeline as AgentFinding["timeline"],
    riskScore: raw.riskScore as number | undefined,
    containment: raw.containment as string[] | undefined,
    eradication: raw.eradication as string[] | undefined,
    recovery: raw.recovery as string[] | undefined,
    postIncident: raw.postIncident as string[] | undefined,
    checklist: raw.checklist as string[] | undefined,
  };
}

function assembleResponse(
  scenarioId: string,
  findings: Record<AgentKey, Record<string, unknown>>,
  usedOpenAI: boolean,
): InvestigationResponse {
  const master = findings.master;
  const remediation = findings.remediation;
  const mitreMappings =
    (master.mitreMappings as InvestigationResponse["mitreMappings"]) ?? [];

  return {
    incidentName: String(master.incidentName ?? "Supply-Chain Attack via Compromised Developer Account"),
    severity: String(master.severity ?? "Critical"),
    riskScore: Number(master.riskScore ?? 84),
    confidence: Number(master.confidence ?? 84),
    rootCause: String(master.rootCause ?? ""),
    attackChain: (master.attackChain as string[]) ?? [],
    agentFindings: AGENT_ORDER.map((key) =>
      toAgentFinding(findings[key], mapAgentName(key)),
    ),
    mitreMappings,
    remediationChecklist: (remediation.checklist as string[]) ?? [],
    finalReport: {
      summary: String(master.summary ?? ""),
      timeline: (master.timeline as InvestigationResponse["finalReport"]["timeline"]) ?? [],
      evidenceSummary: [
        ...(findings.intake.keyFindings as string[] | undefined ?? []),
        ...(findings.auth.keyFindings as string[] | undefined ?? []),
        ...(findings.code.keyFindings as string[] | undefined ?? []),
        ...(findings.network.keyFindings as string[] | undefined ?? []),
      ].slice(0, 8),
      recommendedActions: (remediation.checklist as string[]) ?? [],
    },
    meta: {
      dataSource: `data/incidents/${scenarioId}/`,
      scenarioId,
      usedOpenAI,
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

    return assembleResponse(scenarioId, findings, true);
  } catch {
    return getFallbackInvestigation(scenarioId);
  }
}
