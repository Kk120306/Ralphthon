# CODEX_GOAL.md

## Objective

Build IncidentIQ — a demo-ready, OpenAI-powered autonomous AI SOC dashboard for startups.

## Read These Files First (in order)

1. AGENTS.md — product agents and architecture rules
2. Dashboard.png — primary visual reference for the frontend dashboard
3. SPEC.md — full product specification
4. TASKS.md — complete build task list
5. OPENAI_AGENT_DESIGN.md — OpenAI prompts and API route design
6. MOCK_INCIDENT_DATA.md — the mock security incident to investigate
7. BUILD_ORDER.md — the exact order to build things

## Core Story

A startup receives weak alerts across authentication, secrets, code, and network activity.

Specialized AI agents investigate each evidence source.

A Master Correlation Agent connects the findings into a supply-chain attack narrative.

A Remediation Agent generates concrete response actions.

## Required Architecture

- Next.js with TypeScript
- Tailwind CSS
- shadcn/ui components
- lucide-react icons
- OpenAI API called only from backend (app/api/investigate/route.ts)
- Mock incident data in lib/mockIncident.ts
- Fallback investigation in lib/fallbackInvestigation.ts
- No database, no real auth, no real GitHub API calls

## Required API

POST /api/investigate

Returns structured JSON with all agent findings, attack chain, MITRE mappings, remediation checklist, and final report.

## Required UI

Build the dashboard to closely follow `Dashboard.png` as the primary visual reference. Preserve the same overall information architecture: left incident/agent rail, central raw timeline + live reasoning + attack chain, and right risk/report/remediation column. Match the dark enterprise SOC aesthetic, compact density, red critical accents, monospace event details, and polished high-signal dashboard feel.

Dark enterprise cybersecurity dashboard with:

- Header
- Incident selector
- Run Scenario button + Reset button
- Six agent status cards
- Live reasoning feed
- Risk score panel (animated: 12 → 24 → 35 → 58 → 76 → 84)
- Attack chain visualization (4 nodes, activate progressively)
- MITRE ATT&CK mapping cards
- Remediation checklist (interactive checkboxes)
- Final incident report

## Definition of Done

Task is complete ONLY when:

- App runs with `npm run dev` without errors
- No TypeScript errors
- No broken imports
- POST /api/investigate returns valid JSON
- OpenAI path works when OPENAI_API_KEY is set
- Fallback path works when OPENAI_API_KEY is missing
- Run Scenario button triggers full investigation flow
- All 6 agent cards complete in sequence
- Risk score animates to 84%
- Attack chain activates node by node
- Remediation checklist appears
- Final incident report appears
- Reset button resets everything to idle
- UI is visually polished (dark mode, enterprise feel)
- Demo fits in under 3 minutes

## Priority Order

1. Working investigation flow (no broken state)
2. Reliable fallback (demo never breaks)
3. OpenAI-powered analysis (real reasoning)
4. Dashboard clarity (clear narrative)
5. Visual polish (enterprise look)
6. Animation quality (smooth reveals)

