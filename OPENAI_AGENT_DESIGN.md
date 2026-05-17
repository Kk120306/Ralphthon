# OPENAI_AGENT_DESIGN.md

## Goal

Use OpenAI API to analyze **raw mock security logs** and produce structured security investigation results.

Log files live under `data/incidents/{scenarioId}/`. They are realistic exports (Okta, Vault, GitHub, VPC flow, etc.) with **no pre-labeled attack alerts**. Agents must discover anomalies themselves.

The mock incident data is static; agent reasoning is generated dynamically by the model.

## Data Layout

```
data/incidents/supply-chain-attack/
├── incident.json              # Org + investigation window (agent-safe metadata)
├── authEvents.json            # Okta-style authentication logs
├── secretsEvents.json         # Vault audit logs
├── githubEvents.json          # GitHub push/PR audit events
├── cicdEvents.json            # GitHub Actions workflow runs
├── networkEvents.json         # VPC flow logs
├── threatIntel.json           # IOC feed
├── packageManifests.json      # package.json snapshots (before/after)
└── expected/                  # NEVER send to OpenAI — fallback/validation only
    ├── mitreMapping.json
    ├── attackChain.json
    └── outcome.json
```

Regenerate logs: `python3 scripts/generate-mock-incident-data.py`

See `MOCK_INCIDENT_DATA.md` and `data/incidents/supply-chain-attack/README.md`.

## Logic Layer

| File | Role |
|------|------|
| `lib/mockIncident.ts` | Load JSON from `data/incidents/`, filter to investigation window, slice per agent |
| `lib/agentPrompts.ts` | System/user prompts; instruct models to analyze raw logs |
| `lib/runInvestigation.ts` | Orchestrate OpenAI calls in sequence |
| `lib/fallbackInvestigation.ts` | Deterministic result from `expected/` when API key missing or call fails |
| `app/api/investigate/route.ts` | `POST /api/investigate` entry point |

## Recommended Flow

Run in sequence:
1. Intake Agent — all log sources in investigation window
2. Auth Agent — `authEvents.json` + `secretsEvents.json` (window-filtered)
3. Code Agent — `githubEvents.json` + `cicdEvents.json` + `packageManifests.json`
4. Network Agent — `networkEvents.json` (anomalies + sample) + `threatIntel.json`
5. Master Correlation Agent — specialist JSON outputs + incident metadata
6. Remediation Agent — Master output

## API Route

`POST /api/investigate`

Optional body: `{ "scenarioId": "supply-chain-attack" }`

Steps:
1. `loadIncidentBundle()` from `data/incidents/{scenarioId}/`
2. For each agent: `getEvidenceForAgent()` → `buildAgentPrompt()` → OpenAI
3. If `OPENAI_API_KEY` missing or any step fails → `getFallbackInvestigation()`
4. Return structured JSON

Do not call OpenAI from the frontend. API key is server-side only.

## Evidence Slicing (`lib/mockIncident.ts`)

- **Window filter:** Events filtered to `incident.investigationWindow` (`from` / `to`).
- **Network:** All flows ≥ 50MB in window plus top sampled smaller flows (full export is large).
- **Intake:** Metadata + window-filtered counts/events from each source.
- **Master / Remediation:** Prior agent findings, not raw `expected/` files.

## Response Shape

```json
{
  "incidentName": "Supply-Chain Attack via Compromised Developer Account",
  "severity": "Critical",
  "riskScore": 84,
  "confidence": 84,
  "rootCause": "Compromised developer account (alex.chen@acmefin.dev)",
  "attackChain": [
    "Credential Theft",
    "Secret Access",
    "Malicious Dependency",
    "Data Exfiltration"
  ],
  "agentFindings": [
    {
      "agent": "Intake Agent",
      "status": "complete",
      "summary": "...",
      "riskContribution": 24,
      "keyFindings": [],
      "severity": "Medium"
    }
  ],
  "mitreMappings": [
    { "id": "T1078", "name": "Valid Accounts", "reason": "..." },
    { "id": "T1552", "name": "Unsecured Credentials", "reason": "..." },
    { "id": "T1195", "name": "Supply Chain Compromise", "reason": "..." },
    { "id": "T1041", "name": "Exfiltration Over C2 Channel", "reason": "..." }
  ],
  "remediationChecklist": [],
  "finalReport": {
    "summary": "...",
    "timeline": [],
    "evidenceSummary": [],
    "recommendedActions": []
  },
  "meta": {
    "dataSource": "data/incidents/supply-chain-attack/",
    "scenarioId": "supply-chain-attack",
    "usedOpenAI": true
  }
}
```

## Agent Prompt Style

Each specialist agent receives:
- Global instructions (analyze raw logs, do not assume pre-labeled attacks)
- Role-specific task from `lib/agentPrompts.ts`
- JSON evidence from `getEvidenceForAgent()` — loaded from `data/incidents/...`
- Expected JSON output schema
- Instruction to cite event IDs, timestamps, IPs, package names from evidence

Detailed prompt text: see `AGENT_PROMPTS.md` (if present) or `lib/agentPrompts.ts`.

## Intake Agent

**Evidence:** `incident.json` + window-filtered auth, secrets, github, cicd, network (sampled), threat intel summary.

**Task:** Triage raw logs; group cross-domain signals; recommend escalation.

```json
{
  "agent": "Intake Agent",
  "summary": "",
  "severity": "",
  "confidence": 0,
  "keyFindings": [],
  "riskContribution": 24
}
```

## Auth Agent

**Evidence:** `authEvents.json`, `secretsEvents.json` (investigation window).

```json
{
  "agent": "Auth Agent",
  "summary": "",
  "severity": "",
  "confidence": 0,
  "keyFindings": [],
  "mitreMappings": [],
  "riskContribution": 35
}
```

## Code Agent

**Evidence:** `githubEvents.json`, `cicdEvents.json`, `packageManifests.json`.

```json
{
  "agent": "Code Agent",
  "summary": "",
  "severity": "",
  "confidence": 0,
  "keyFindings": [],
  "mitreMappings": [],
  "riskContribution": 58
}
```

## Network Agent

**Evidence:** `networkEvents.json` (prioritized flows), `threatIntel.json`.

```json
{
  "agent": "Network Agent",
  "summary": "",
  "severity": "",
  "confidence": 0,
  "keyFindings": [],
  "mitreMappings": [],
  "riskContribution": 76
}
```

## Master Correlation Agent

**Evidence:** Specialist agent JSON outputs + incident metadata.

```json
{
  "agent": "Master Correlation Agent",
  "summary": "",
  "rootCause": "",
  "severity": "",
  "confidence": 84,
  "riskScore": 84,
  "attackChain": [],
  "timeline": [],
  "mitreMappings": []
}
```

## Remediation Agent

**Evidence:** Master Correlation Agent output.

```json
{
  "agent": "Remediation Agent",
  "summary": "",
  "containment": [],
  "eradication": [],
  "recovery": [],
  "postIncident": [],
  "checklist": []
}
```

## Fallback Requirement

If OpenAI API is unavailable or fails, return `getFallbackInvestigation()` which reads:

- `data/incidents/{scenarioId}/expected/attackChain.json`
- `data/incidents/{scenarioId}/expected/mitreMapping.json`
- `data/incidents/{scenarioId}/expected/outcome.json`

The fallback must be complete — every field populated, risk score 84%, all agents complete.

This is required for demo safety.
