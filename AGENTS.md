# AGENTS.md

## Project Name

Sentinel Swarm

## Tagline

Autonomous AI SOC for Startups

## Project Summary

Sentinel Swarm is a hackathon MVP that demonstrates how AI agents can act like a small security operations team.

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

Sentinel Swarm investigates this incident using multiple AI agents.

## Required Product Agents

1. Intake Agent
2. Auth Agent
3. Code Agent
4. Network Agent
5. Master Correlation Agent
6. Remediation Agent

These are the security investigation agents shown inside the product — not coding agents.

## Important Architecture Rule

Use OpenAI API models to analyze mock security data.

Do not hardcode the final investigation as purely static text unless used as a fallback.

The MVP should feel like real AI agents are investigating evidence.

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

## Required API Route

POST /api/investigate

This route should:
1. Load mock incident data
2. Run specialist agents via OpenAI
3. Run Master Correlation Agent
4. Run Remediation Agent
5. Return structured JSON

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
- Risk score reaches 84%
- All agents visibly complete
- Final report appears
- Demo fits in under 3 minutes
