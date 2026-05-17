# Demo-Wow Enhancement Plan for IncidentIQ MVP

## Summary

Enhance the app from a linear dashboard into a more interactive SOC simulation while preserving demo reliability. Optimize for a polished hackathon flow: clearer suspense, richer evidence exploration, stronger agent “team” feeling, and a more satisfying final incident report.

### 2. Make evidence drilldowns interactive

- Each raw timeline event becomes clickable.
- Clicking opens an evidence drawer/modal showing:
  - event source
  - timestamp
  - severity
  - relevant JSON evidence excerpt
  - linked agent that later investigates it
- Add a “Correlated by” badge after the matching specialist agent completes.
- Use existing mock JSON from `lib/mockIncident.ts`; do not invent new static findings.

### 3. Upgrade agent interactivity

- Agent cards become expandable.
- Expanded state shows:
  - summary
  - confidence
  - severity
  - key findings
  - MITRE mappings
  - cited evidence IDs where available
- During investigation, each agent should move through:
  - queued
  - investigating
  - complete
- Add small animated progress/status copy such as:
  - “Parsing Vault logs”
  - “Comparing package manifests”
  - “Correlating outbound traffic”
- Status copy can be deterministic UI scaffolding; actual findings must remain OpenAI/fallback response data.

### 4. Add a correlation graph view

- Add a central correlation graph panel.
- Nodes:
  - suspicious login
  - secret access
  - dependency change
  - production deploy
  - outbound exfiltration
- Edges:
  - same user/IP
  - temporal proximity
  - deployed after commit
  - egress after deploy
- Reveal graph nodes as raw events stream in.
- Highlight edges as specialist/master agents complete.
- Build with React/Tailwind/SVG or div-based layout; avoid new graph dependencies.

### 5. Improve final report and mock PR presentation

- Final report gets tabs:
  - Executive Summary
  - Timeline
  - Evidence
  - MITRE
  - Remediation
- Add a “Copy incident brief” button that copies a concise Markdown report.
- Mock PR panel gets:
  - collapsible diff
  - file changed chips
  - generated/fallback source badge
  - “Copy patch” button
- All report/PR content should come from OpenAI response when `meta.usedOpenAI=true`; otherwise fallback response.  
possibly redirect to a seperate page 

## Public Interfaces / Types

- Extend `RawTimelineEvent` with optional fields:
  - `id`
  - `raw`
  - `linkedAgent`
  - `correlationTags`
- Add a UI-only `SimulationPhase` type:
  - `idle`
  - `streaming-events`
  - `running-agents`
  - `correlating`
  - `remediation`
  - `complete`
  - `error`
- Keep `POST /api/investigate` unchanged for compatibility.
- Extend existing `GET /api/investigate?scenarioId=...` timeline response to include raw event excerpts needed by the evidence drawer.

## Test Plan

Run:

```bash
npm run typecheck
npm run lint
npm run build
npm run e2e:smoke
npm run e2e:responsive
```

E2E smoke coverage should verify:

- Initial raw timeline is empty.
- Events reveal gradually.
- Pause freezes reveal count.
- Resume continues reveal count.
- Step reveals exactly one next item.
- Evidence drawer opens for a raw event.
- Agent card expands after completion.
- Final report tabs render after completion.
- Copy buttons do not throw browser errors.
- Reset clears timers, drawer, expanded cards, graph, final report, and copied state.

Responsive audit should verify:

- No horizontal overflow on mobile, tablet, laptop, or desktop.
- Drawer/modal remains usable on narrow screens.
- Correlation graph remains readable or stacks gracefully.

## Assumptions

- Priority is “Demo wow” over deep analyst tooling.
- No real GitHub, auth, cloud, database, or external SOC integrations.
- No new dependencies unless absolutely necessary.
- Graph and drawer should be built with the existing React/Tailwind/lucide stack.
- OpenAI/fallback behavior remains all-or-fallback:
  - if OpenAI succeeds, investigation output uses OpenAI response data
  - if OpenAI fails, the whole investigation uses deterministic fallback data

