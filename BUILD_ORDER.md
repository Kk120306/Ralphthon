# BUILD_ORDER.md

## Purpose

This file tells the AI agent the exact order to build IncidentIQ so the demo works reliably on the first run.

Follow this order precisely. Do not skip steps.

## Phase 1 — Project Scaffold

1. Initialize Next.js project with TypeScript and Tailwind CSS
2. Install dependencies: openai, lucide-react, shadcn/ui (or manually add components)
3. Configure Tailwind for dark mode (class strategy)
4. Take a look at the env file to verify Open api key is present
5. Verify app builds with no errors before continuing

## Phase 2 — Data and Logic Layer

1. Verify raw logs exist: `data/incidents/supply-chain-attack/*.json` (run `python3 scripts/generate-mock-incident-data.py` if missing)
2. `lib/mockIncident.ts` — load JSON logs from disk; `getEvidenceForAgent()` per agent
3. `lib/agentPrompts.ts` — prompts reference raw evidence, not pre-labeled alerts
4. `lib/runInvestigation.ts` — OpenAI orchestration
5. `lib/fallbackInvestigation.ts` — reads `data/incidents/.../expected/` for demo-safe fallback

The fallback must have:

- All 6 agentFindings with status "complete"
- riskScore: 84
- All 4 attackChain steps
- All 4 mitreMappings
- Full remediationChecklist (9 items)
- Full finalReport

## Phase 3 — API Route

1. Create app/api/investigate/route.ts
2. Implement the POST handler:
  - `loadIncidentBundle()` + `runInvestigation()` from `data/incidents/supply-chain-attack/`
    - If OPENAI_API_KEY exists: call OpenAI for each agent with `getEvidenceForAgent()` slices
    - Parse each agent JSON response
    - If any step fails: fall back to lib/fallbackInvestigation.ts
    - Return full investigation JSON
3. Test the route manually: curl -X POST [http://localhost:3000/api/investigate](http://localhost:3000/api/investigate)
4. Verify it returns valid JSON in both OpenAI and fallback mode

## Phase 4 — UI Components

Build components in this order:

1. types/investigation.ts — TypeScript types for the full response shape
2. components/AgentCard.tsx — single agent status card
3. components/RiskScorePanel.tsx — animated risk score
4. components/AttackChain.tsx — 4-node chain visualization
5. components/ReasoningFeed.tsx — scrollable live feed
6. components/MitreCards.tsx — MITRE ATT&CK mapping cards
7. components/RemediationChecklist.tsx — interactive checklist
8. components/FinalReport.tsx — final incident report panel

## Phase 5 — Main Dashboard Page

1. Build app/page.tsx as the main dashboard
2. Use `Dashboard.png` as the primary frontend reference while building the page:
  - Follow the same three-column SOC dashboard composition
  - Left rail: incident list and agent progress/status cards
  - Center: raw event timeline, live agent reasoning stream, and attack chain cards
  - Right rail: risk score, final incident report, and remediation actions
  - Match the compact dark enterprise style, red critical accents, monospace event/timing details, subtle borders, and polished demo-ready density
3. Add more components if required to match `Dashboard.png`
4. Implement state machine: idle | investigating | complete
5. Wire Run Scenario button to POST /api/investigate
6. Implement progressive reveal with 1500ms delay between agents
7. Wire risk score to update at each agent reveal
8. Wire attack chain nodes to activate progressively
9. Wire Reset button to clear all state

## Phase 6 — Polish and Verify

1. Verify dark mode looks correct
2. Verify all 6 agents complete in sequence
3. Verify risk score reaches 84%
4. Verify attack chain fully activates
5. Verify Reset returns everything to idle
6. Run TypeScript type check: npx tsc --noEmit
7. Run build: npm run build
8. Fix any errors

## Done

The build is complete when all items in the Definition of Done in CODEX_GOAL.md are checked off.