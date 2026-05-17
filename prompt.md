# Goal Mode Prompt

```text
/goal Build the IncidentIQ application from the existing repo specs into a demo-ready Next.js TypeScript Tailwind app, verified by local typecheck, production build, API route checks, and a running dev server. Follow AGENTS.md, CODEX_GOAL.md, SPEC.md, TASKS.md, OPENAI_AGENT_DESIGN.md, MOCK_INCIDENT_DATA.md, BUILD_ORDER.md, DEMO_FLOW.md, and Dashboard.png as the source of truth.

Iteration policy:
After each build, typecheck, API, or UI verification result, decide the next most useful action and continue automatically until the success criteria are met. If a command fails, inspect the error, fix the root cause, and rerun the smallest relevant verification. If visual polish is weak, iterate on the UI until it matches the Dashboard.png direction closely enough for a polished demo.

Blocked stop condition:
Stop only if an irreversible/destructive action, missing credential authority, unavailable network/dependency installation approval, or an unsatisfied external permission blocks progress. If blocked, report the exact blocker, evidence gathered, attempted alternatives, and the smallest user action needed to unblock. Do not mark the Goal complete until the verification evidence supports completion.
```

