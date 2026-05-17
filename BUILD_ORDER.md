# BUILD_ORDER.md

## Purpose

This file tells the AI agent the exact order to build Sentinel Swarm so the demo works reliably on the first run.

Follow this order precisely. Do not skip steps.

## Phase 1 — Project Scaffold

1. Initialize Next.js project with TypeScript and Tailwind CSS
2. Install dependencies: openai, lucide-react, shadcn/ui (or manually add components)
3. Configure Tailwind for dark mode (class strategy)
4. Set up .env.local.example with OPENAI_API_KEY=your-key-here
5. Verify app builds with no errors before continuing

## Phase 2 — Data and Logic Layer

6. Create lib/mockIncident.ts — export typed mock incident data
7. Create lib/agentPrompts.ts — export prompt builders for all 6 agents
8. Create lib/fallbackInvestigation.ts — export complete hardcoded investigation result

The fallback must have:
- All 6 agentFindings with status "complete"
- riskScore: 84
- All 4 attackChain steps
- All 4 mitreMappings
- Full remediationChecklist (9 items)
- Full finalReport

## Phase 3 — API Route

9. Create app/api/investigate/route.ts
10. Implement the POST handler:
    - Load mock incident data
    - If OPENAI_API_KEY exists: call OpenAI for each agent in sequence
    - Parse each agent JSON response
    - If any step fails: fall back to lib/fallbackInvestigation.ts
    - Return full investigation JSON
11. Test the route manually: curl -X POST http://localhost:3000/api/investigate
12. Verify it returns valid JSON in both OpenAI and fallback mode

## Phase 4 — UI Components

Build components in this order:

13. types/investigation.ts — TypeScript types for the full response shape
14. components/AgentCard.tsx — single agent status card
15. components/RiskScorePanel.tsx — animated risk score
16. components/AttackChain.tsx — 4-node chain visualization
17. components/ReasoningFeed.tsx — scrollable live feed
18. components/MitreCards.tsx — MITRE ATT&CK mapping cards
19. components/RemediationChecklist.tsx — interactive checklist
20. components/FinalReport.tsx — final incident report panel

## Phase 5 — Main Dashboard Page

22. Build app/page.tsx as the main dashboard
23. Implement state machine: idle | investigating | complete
24. Wire Run Scenario button to POST /api/investigate
25. Implement progressive reveal with 1500ms delay between agents
26. Wire risk score to update at each agent reveal
27. Wire attack chain nodes to activate progressively
28. Wire Reset button to clear all state

## Phase 6 — Polish and Verify

29. Verify dark mode looks correct
30. Verify all 6 agents complete in sequence
31. Verify risk score reaches 84%
32. Verify attack chain fully activates
34. Verify Reset returns everything to idle
35. Run TypeScript type check: npx tsc --noEmit
36. Run build: npm run build
37. Fix any errors

## Done

The build is complete when all items in the Definition of Done in RALPH_GOAL.md are checked off.
