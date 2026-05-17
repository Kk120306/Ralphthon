# TASKS.md

## Build Objective

Build IncidentIQ, a demo-ready OpenAI-powered AI SOC dashboard.

The app uses mock incident data but real OpenAI API analysis.

## Must Build

### 1. Next.js Project Setup

- Next.js with TypeScript
- Tailwind CSS configured
- shadcn/ui installed (Button, Card, Badge, Progress)
- lucide-react installed
- .env.local.example with OPENAI_API_KEY placeholder

### 2. Mock Incident Data Module

File: `lib/mockIncident.ts`

Load raw logs from `data/incidents/supply-chain-attack/` (see `MOCK_INCIDENT_DATA.md`):

- `loadIncidentBundle(scenarioId)` — reads `authEvents.json`, `secretsEvents.json`, `githubEvents.json`, `cicdEvents.json`, `networkEvents.json`, `threatIntel.json`, `packageManifests.json`, `incident.json`
- `getEvidenceForAgent(agent, bundle)` — filters to investigation window and slices per agent (no `expected/` files)

Do not embed pre-labeled alerts; agents analyze raw logs.

### 3. Agent Prompts Module

File: lib/agentPrompts.ts

Export prompt-building functions for each agent as specified in OPENAI_AGENT_DESIGN.md.

### 4. Fallback Investigation Module

File: lib/fallbackInvestigation.ts

Export a complete, hardcoded investigation result that matches the full response shape.

All fields must be populated. Risk score must be 84. All agents must be complete.

This is used when OPENAI_API_KEY is missing or the API call fails.

### 5. API Route

File: app/api/investigate/route.ts

POST /api/investigate

Logic:
1. `loadIncidentBundle()` from `data/incidents/supply-chain-attack/`
2. Check for `OPENAI_API_KEY`
3. If key exists: for each agent, `getEvidenceForAgent()` → OpenAI with prompts from `lib/agentPrompts.ts`
4. If key missing or error: `getFallbackInvestigation()` (reads `data/incidents/.../expected/`)
5. Return JSON

### 6. Dashboard Layout

Dark mode enterprise cybersecurity dashboard.

Required elements:
- Header: "IncidentIQ" + "Autonomous AI SOC for Startups"
- Incident badge: "AcmeFin — Supply-Chain Attack"
- Run Scenario button (primary, prominent)
- Reset button
- Status indicator (Idle / Investigating / Complete)

### 7. Agent Status Cards

Six cards, one per agent:
- Intake Agent
- Auth Agent
- Code Agent
- Network Agent
- Master Correlation Agent
- Remediation Agent

Each card shows:
- Agent name and role description
- Status: idle | investigating | complete | error
- Animated spinner when investigating
- Green checkmark when complete
- Confidence score (shown after complete)
- Summary text (shown after complete)

### 8. Live Reasoning Feed

A scrollable panel showing messages as they appear.

Messages are added progressively as each agent completes.

Format: [Agent Name] Finding text

### 9. Risk Score Panel

Animated circular or bar progress indicator.

Starts at 0. Progresses through: 12 → 24 → 35 → 58 → 76 → 84

Shows percentage number and label.

Final label: "Critical Risk" in red.

### 10. Attack Chain Visualization

Four nodes connected by arrows:
Credential Theft → Secret Access → Malicious Dependency → Data Exfiltration

Nodes start grey/inactive. Activate one by one as investigation progresses.
Active node: colored (red or amber). Inactive: grey.

### 11. MITRE ATT&CK Cards

Four cards:
- T1078 — Valid Accounts
- T1552 — Unsecured Credentials
- T1195 — Supply Chain Compromise
- T1041 — Exfiltration Over C2 Channel

Each card shows: technique ID, name, brief reason from agent findings.

### 12. Remediation Checklist

Checkbox list populated from Remediation Agent output.

Required items:
- Disable compromised developer account
- Rotate production API keys
- Remove suspicious dependency (lodash-utilz)
- Pause deployment pipeline
- Block suspicious outbound IP (45.77.88.21)
- Review recent commits on main branch
- Audit secrets access logs
- Notify engineering and security team
- Generate post-incident report

Checkboxes are interactive (user can check them off).

### 13. Final Incident Report

Panel showing:
- Incident Type
- Severity badge (Critical — red)
- Confidence score
- Root Cause
- Attack Chain summary
- Evidence Summary
- Timeline of events
- Recommended Actions


## Frontend Behavior

State machine:

idle → investigating → complete

On "Run Scenario" click:
1. Set state to investigating
2. Call POST /api/investigate
3. Receive full result
4. Reveal each agent result with a 1.5s delay between them
5. Update risk score at each agent reveal
6. Activate attack chain nodes progressively
7. After all agents complete: show final report
8. Set state to complete

On "Reset" click:
1. Clear all results
2. Reset risk score to 0
3. Reset all agent cards to idle
4. Reset attack chain nodes to inactive
5. Set state to idle

## Error Handling

- Show error state on agent card if agent fails
- Show toast or banner if API call fails entirely
- Always fall back gracefully — never leave the dashboard broken

## Reliability Requirements

- Fallback output must be complete and work without API key
- Loading state must be visible
- Reset must always work
- No unhandled promise rejections
- No TypeScript errors
