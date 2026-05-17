export type AgentName =
  | "Intake Agent"
  | "Auth Agent"
  | "Code Agent"
  | "Network Agent"
  | "Master Correlation Agent"
  | "Remediation Agent";

export interface MitreMapping {
  id: string;
  name: string;
  reason?: string;
  tactic?: string;
}

export interface AgentFinding {
  agent: AgentName;
  status: "complete" | "error";
  summary: string;
  riskContribution?: number;
  keyFindings?: string[];
  severity?: string;
  confidence?: number;
  mitreMappings?: MitreMapping[];
  rootCause?: string;
  attackChain?: string[];
  timeline?: Array<{ time: string; event: string; source?: string }>;
  riskScore?: number;
  containment?: string[];
  eradication?: string[];
  recovery?: string[];
  postIncident?: string[];
  checklist?: string[];
}

export interface MockPrResult {
  source: "openai" | "deterministic-fallback";
  title: string;
  summary: string;
  filesChanged: Array<{ path: string; changeType: "modified" | "removed" | "added" }>;
  patch: string;
  riskRemovalExplanation: string;
  validationNotes: string[];
}

export interface RawTimelineEvent {
  time: string;
  source: string;
  text: string;
  severity: "HIGH" | "CRITICAL";
}

export interface InvestigationResponse {
  incidentName: string;
  severity: string;
  riskScore: number;
  confidence: number;
  rootCause: string;
  attackChain: string[];
  agentFindings: AgentFinding[];
  mitreMappings: MitreMapping[];
  remediationChecklist: string[];
  finalReport: {
    summary: string;
    timeline: Array<{ time: string; event: string; source?: string }>;
    evidenceSummary: string[];
    recommendedActions: string[];
  };
  mockPrResult: MockPrResult;
  meta?: {
    dataSource: string;
    scenarioId: string;
    usedOpenAI: boolean;
  };
}

export interface IncidentMeta {
  id: string;
  scenarioId: string;
  organization: { name: string; domain: string; industry: string; size: string };
  investigationWindow: { from: string; to: string; timezone: string };
  dataSources: string[];
  validationOnly: string[];
  repositories: string[];
  productionHosts: string[];
}

export interface LogFile<T> {
  source: string;
  exportedAt?: string;
  recordCount?: number;
  events?: T[];
  indicators?: unknown[];
  [key: string]: unknown;
}

export interface IncidentBundle {
  scenarioId: string;
  basePath: string;
  incident: IncidentMeta;
  authEvents: LogFile<Record<string, unknown>>;
  secretsEvents: LogFile<Record<string, unknown>>;
  githubEvents: LogFile<Record<string, unknown>>;
  cicdEvents: LogFile<Record<string, unknown>>;
  networkEvents: LogFile<Record<string, unknown>>;
  threatIntel: LogFile<Record<string, unknown>>;
  packageManifests: Record<string, unknown>;
}

export type SpecialistAgent = "intake" | "auth" | "code" | "network";
export type AgentKey = SpecialistAgent | "master" | "remediation";
