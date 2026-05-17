# AGENTS.md

## Project Name

IncidentIQ

## Tagline

Autonomous AI SOC for Startups

## Project Summary

IncidentIQ is a hackathon MVP that demonstrates how AI agents can act like a small security operations team.

The app uses mock security data, but the investigation should be performed by real OpenAI-powered agents.

The data is fake.
The analysis is real.

The dashboard should show how multiple specialized agents investigate separate evidence sources and how a Master Correlation Agent connects everything into one coherent attack story.

## Core Product Idea

A startup receives several weak security alerts:

- suspicious developer login
- unusual secret access
- suspicious dependency added to the codebase
- large outbound data transfer

Individually, each alert may not look critical.

Together, they reveal a supply-chain attack caused by a compromised developer account.

IncidentIQ investigates this incident using multiple AI agents.

## Required Product Agents

1. Intake Agent — First-responder triage analyst. Receives all 5 raw alerts, groups related signals, assigns initial severity, and decides whether specialist investigation is warranted. Key output: 5 alerts across auth, secrets, code, and network fired within 40 minutes — individually weak, collectively suspicious. Recommends escalation.
2. Auth Agent — Identity and authentication specialist. Receives the suspicious login (Moscow, unknown device, MFA passed) and secrets access (PROD_PAYMENT_GATEWAY_KEY grabbed 6 minutes later). Flags the geography and device anomaly, notes MFA passing is insufficient clearance given the context, and assesses high likelihood of credential compromise.
3. Code Agent — Repository and supply chain specialist. Receives the dependency addition (lodash-utilz, 19 minutes after login) and CI/CD trigger (deployed successfully). Identifies lodash-utilz as a typosquat of the legitimate lodash-utils, flags the innocuous commit message as a social engineering tactic, and confirms the malicious package is likely now active in production.
4. Network Agent — Traffic analysis and exfiltration specialist. Receives the outbound transfer event (10.4GB to unapproved IP, 21 minutes after deployment). Flags volume at 26x the normal hourly baseline, unknown destination, and HTTPS protocol consistent with disguised exfiltration. Notes uncertainty — cannot confirm data contents, but timing and volume are highly anomalous.
5. Master Correlation Agent — Senior incident commander. Receives all four specialist outputs and synthesizes them into a single attack narrative. Reconstructs the full 40-minute chain — credential theft → secrets access → dependency injection → data exfiltration. Identifies root cause as a compromised developer account. Assigns final severity (Critical) and confidence (84%).
6. Remediation Agent — Incident response planner. Receives the Master Agent's output and generates a four-phase response: Containment (disable account, rotate keys, block IP, pause pipeline), Eradication (remove dependency, audit commits), Recovery (restore from last known-good deployment), and Post-Incident (package blocklist, CI checks, incident report).Sonnet 4.6Claude is AI and can make mistakes. Please double-check responses.

These are the security investigation agents shown inside the product — not coding agents.

## Important Architecture Rule

Use OpenAI API models to analyze mock security data.

Do not hardcode the final investigation as purely static text unless used as a fallback.

The MVP should feel like real AI agents are investigating evidence.

## Required Mock PR Result

The product should also show a mock GitHub-style PR result for the suspicious code/dependency issue.

This is not a real GitHub integration. Do not call GitHub APIs, create branches, open real pull requests, or require GitHub authentication.

The PR result should feel like an AI-generated remediation proposal against the provided sample input code. If OpenAI can produce a valid solution, show the AI-generated PR-style output. If OpenAI is unavailable, fails, or returns unusable output, show a deterministic sample solution that the demo can rely on.

The mock PR result should include:

- PR title
- PR summary
- Files changed
- Patch or code-diff style solution
- Explanation of how the solution removes the malicious dependency risk
- Test or validation notes
- Clear label showing whether the result came from OpenAI or deterministic fallback

## Technical Constraints

- Use Next.js
- Use TypeScript
- Use Tailwind CSS
- Use shadcn/ui if available
- Use lucide-react if available
- Use OpenAI API from the backend/API route only
- Do not expose the OpenAI API key in the frontend
- Use static mock incident data
- No GitHub integration
- No real auth provider integration
- No real cloud integration
- No real database
- No user authentication
- No billing
- No production infrastructure
- API Key has been provided in the global env file

## Required API Route

POST /api/investigate

This route should:
1. Load raw logs from `data/incidents/supply-chain-attack/` via `lib/mockIncident.ts`
2. Run specialist agents via OpenAI (each agent receives window-filtered log slices)
3. Run Master Correlation Agent
4. Run Remediation Agent
5. Generate or fall back to the mock PR result sample
6. Return structured JSON

## Required Dashboard Behavior

User clicks "Run Supply-Chain Attack Scenario" then the frontend reveals:

1. Intake Agent starts and completes
2. Auth Agent starts and completes
3. Code Agent starts and completes
4. Network Agent starts and completes
5. Master Correlation Agent starts and completes
6. Remediation Agent starts and completes
7. Final incident report appears

The API returns all results at once. The frontend reveals them step by step.

## Risk Score Progression

12% → 24% → 35% → 58% → 76% → 84%

Final: 84% — Critical Risk

## Required Attack Chain

Credential Theft → Secret Access → Malicious Dependency → Data Exfiltration

## Required MITRE ATT&CK Mappings

- T1078 — Valid Accounts
- T1552 — Unsecured Credentials
- T1195 — Supply Chain Compromise
- T1041 — Exfiltration Over C2 Channel

## Non-Negotiables

- Prioritize demo reliability
- Use real OpenAI reasoning where possible
- Add deterministic fallback output if OpenAI API fails
- Keep the demo understandable in under 3 minutes
- Dashboard must be visually polished and enterprise-grade

## Definition of Done

- App runs locally with no TypeScript errors
- Run Scenario works end to end
- Reset works
- OpenAI path works when API key is set
- Fallback works when API key is missing
- Mock PR result appears with AI output when available or sample fallback when not
- Risk score reaches 84%
- All agents visibly complete
- Final report appears
- Demo fits in under 3 minutes
