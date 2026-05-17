import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { DEFAULT_SCENARIO_ID } from "./mockIncident";
import type { AgentFinding, InvestigationResponse, MitreMapping, MockPrResult } from "./types/investigation";

function readExpected<T>(scenarioId: string, file: string): T {
  const path = join(process.cwd(), "data", "incidents", scenarioId, "expected", file);
  if (!existsSync(path)) {
    throw new Error(`Expected data file not found: ${path}`);
  }
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}


export function getDeterministicMockPrResult(): MockPrResult {
  return {
    source: "deterministic-fallback",
    title: "Remove suspicious lodash-utilz dependency and lock trusted utility package",
    summary:
      "Reverts the typosquatted lodash-utilz package introduced in the suspicious dependency update, restores the trusted lodash-utils dependency, and adds a package-manager guard so future lookalike packages fail validation before deploy.",
    filesChanged: [
      { path: "package.json", changeType: "modified" },
      { path: "package-lock.json", changeType: "modified" },
      { path: "scripts/validate-dependencies.js", changeType: "added" },
    ],
    patch: `diff --git a/package.json b/package.json
@@
-    "lodash-utilz": "^1.0.4"
+    "lodash-utils": "^1.0.4"
@@
-    "build": "tsc && node dist/server.js"
+    "prebuild": "node scripts/validate-dependencies.js",
+    "build": "tsc && node dist/server.js"
diff --git a/scripts/validate-dependencies.js b/scripts/validate-dependencies.js
new file mode 100644
@@
+const blocked = ["lodash-utilz"];
+const pkg = require("../package.json");
+const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
+const found = blocked.filter((name) => deps[name]);
+if (found.length) {
+  console.error("Blocked suspicious dependencies: " + found.join(", "));
+  process.exit(1);
+}
+console.log("Dependency allowlist check passed");`,
    riskRemovalExplanation:
      "The patch removes the lookalike package that likely executed in production after gha-91024 and replaces it with the intended trusted package name. The validation hook blocks the known malicious dependency before future CI/CD builds can ship it.",
    validationNotes: [
      "Run npm install to refresh package-lock.json after dependency replacement",
      "Run npm run prebuild to confirm lodash-utilz is blocked",
      "Run unit tests and production build before unpausing deployment",
    ],
  };
}

/** Deterministic investigation result from `data/incidents/{id}/expected/` — demo-safe when OpenAI is unavailable. */
export function getFallbackInvestigation(
  scenarioId: string = DEFAULT_SCENARIO_ID,
): InvestigationResponse {
  const attackChain = readExpected<Array<{ order: number; phase: string; approxTime: string }>>(
    scenarioId,
    "attackChain.json",
  );
  const mitreRaw = readExpected<
    Array<{ id: string; name: string; tactic: string; linkedEvidenceHints?: string[] }>
  >(scenarioId, "mitreMapping.json");
  const { outcome, remediation } = readExpected<{
    outcome: {
      rootCause: string;
      severity: string;
      confidence: number;
      riskScore: number;
      incidentType: string;
    };
    remediation: string[];
  }>(scenarioId, "outcome.json");

  const chainLabels = attackChain.map((s) => s.phase);
  const timeline = attackChain.map((s) => ({
    time: s.approxTime,
    event: s.phase,
    source: "correlated",
  }));

  const mitreMappings: MitreMapping[] = mitreRaw.map((m) => ({
    id: m.id,
    name: m.name,
    reason: `Correlated with evidence: ${(m.linkedEvidenceHints ?? []).join(", ")}`,
    tactic: m.tactic,
  }));

  const agentFindings: AgentFinding[] = [
    {
      agent: "Intake Agent",
      status: "complete",
      summary:
        "Five correlated signals across authentication, secrets, repository, CI/CD, and network within a 40-minute window on 2026-05-17. Individually low-noise; collectively warrant full investigation.",
      severity: "Medium",
      confidence: 42,
      riskContribution: 24,
      keyFindings: [
        "Multiple domain logs in investigation window (auth, vault, github, gha, vpc)",
        "Temporal clustering between 09:12 and 09:52 +08:00",
        "Recommend Auth, Code, and Network specialist analysis",
      ],
      evidenceIds: ["okta-ev-31847", "vault-audit-29401", "gh-48291", "gha-91024", "flow-910882"],
    },
    {
      agent: "Auth Agent",
      status: "complete",
      summary:
        "alex.chen@acmefin.dev authenticated from Moscow (185.199.108.153) on unknown Linux Chrome device; MFA passed. PROD_PAYMENT_GATEWAY_KEY read six minutes later from same IP.",
      severity: "High",
      confidence: 78,
      riskContribution: 35,
      keyFindings: [
        "Login okta-ev-31847 — geo anomaly vs usual Singapore pattern",
        "Vault vault-audit-29401 — rare production payment secret read",
        "High likelihood of credential compromise despite MFA success",
      ],
      evidenceIds: ["okta-ev-31847", "vault-audit-29401"],
      mitreMappings: mitreMappings.filter((m) => m.id === "T1078" || m.id === "T1552"),
    },
    {
      agent: "Code Agent",
      status: "complete",
      summary:
        "Commit a4f91c2e8b3d ('minor utility cleanup') added npm package lodash-utilz — typosquat of lodash-utils. deploy-production succeeded at 09:36.",
      severity: "High",
      confidence: 82,
      riskContribution: 58,
      keyFindings: [
        "gh-48291 push to main — package.json change",
        "packageManifests show lodash-utilz added after snapshot c3d81f0",
        "gha-91024 production deploy — dependency audit not run",
      ],
      evidenceIds: ["gh-48291", "gha-91024"],
      mitreMappings: mitreMappings.filter((m) => m.id === "T1195"),
    },
    {
      agent: "Network Agent",
      status: "complete",
      summary:
        "flow-910882: ~10.4GB HTTPS egress from api-prod-01 to 45.77.88.21 (~26x hourly baseline). Timing follows production deploy. Payload contents unconfirmed from flow logs alone.",
      severity: "Critical",
      confidence: 75,
      riskContribution: 76,
      keyFindings: [
        "Destination 45.77.88.21 flagged in threat intel",
        "Volume highly anomalous vs 400 MB/hour baseline",
        "Cannot confirm specific exfiltrated data from netflow alone",
      ],
      evidenceIds: ["flow-910882"],
      mitreMappings: mitreMappings.filter((m) => m.id === "T1041"),
    },
    {
      agent: "Master Correlation Agent",
      status: "complete",
      summary:
        "Coordinated supply-chain attack: compromised developer credentials → production secret access → malicious dependency deployed → large outbound transfer.",
      severity: outcome.severity,
      confidence: outcome.confidence,
      riskContribution: 84,
      riskScore: 84,
      rootCause: outcome.rootCause,
      attackChain: chainLabels,
      timeline,
      mitreMappings,
      evidenceIds: ["okta-ev-31847", "vault-audit-29401", "gh-48291", "gha-91024", "flow-910882"],
    },
    {
      agent: "Remediation Agent",
      status: "complete",
      summary: "Immediate containment and eradication required; pause pipeline until dependency removed and secrets rotated.",
      containment: remediation.slice(0, 4),
      eradication: remediation.slice(4, 6),
      recovery: ["Redeploy from last known-good build without lodash-utilz"],
      postIncident: remediation.slice(6),
      checklist: remediation,
      evidenceIds: ["gh-48291", "gha-91024", "flow-910882"],
    },
  ];

  return {
    incidentName: `${outcome.incidentType} via Compromised Developer Account`,
    severity: outcome.severity,
    riskScore: outcome.riskScore,
    confidence: outcome.confidence,
    rootCause: outcome.rootCause,
    attackChain: chainLabels,
    agentFindings,
    mitreMappings,
    remediationChecklist: remediation,
    finalReport: {
      summary: agentFindings[4].summary ?? "",
      timeline,
      evidenceSummary: [
        "Suspicious login from Moscow on unknown device (okta-ev-31847)",
        "PROD_PAYMENT_GATEWAY_KEY accessed (vault-audit-29401)",
        "Typosquat dependency lodash-utilz committed and deployed (gh-48291, gha-91024)",
        "10.4GB egress to 45.77.88.21 (flow-910882)",
      ],
      recommendedActions: remediation,
    },
    mockPrResult: getDeterministicMockPrResult(),
    meta: {
      dataSource: `data/incidents/${scenarioId}/`,
      scenarioId,
      usedOpenAI: false,
    },
  };
}
