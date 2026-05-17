# IncidentIQ Landing Page Plan

## Summary

Build a polished landing page at `/` that matches the existing dashboard's dark enterprise SOC aesthetic. Move the current investigation dashboard to `/dashboard`, then use the landing page as a high-signal product entry point with a primary CTA into the live demo.

The page should feel like the same product as the dashboard: dense, serious, cybersecurity-focused, dark shell background, ember critical accents, mint/cobalt/amber/violet highlights, mono metadata, bordered panels, subtle scanline/noise atmosphere, and animated operational details.

## Key Changes

- Move the current dashboard implementation from `app/page.tsx` to `app/dashboard/page.tsx`.
- Replace `app/page.tsx` with a new landing page using the existing Tailwind theme tokens: `shell`, `panel`, `panel2`, `line`, `ember`, `amber`, `cobalt`, `violet`, and `mint`.
- Add a hero section with the IncidentIQ name, "Autonomous AI SOC for Startups," a concise value proposition, and a CTA to `/dashboard`.
- Add a live SOC preview inspired by the dashboard, showing agent statuses, risk score `84`, attack chain, and telemetry snippets.
- Add an agent system overview for the six product agents, using the same visual language as `AgentCard`.
- Add an attack story section: Credential Theft -> Secret Access -> Malicious Dependency -> Data Exfiltration.
- Add a demo outcome strip covering Critical Risk, 84% confidence, MITRE ATT&CK mappings, and the remediation PR result.
- Keep the first viewport product-forward and demo-forward, not a generic SaaS marketing hero.
- Reuse `lucide-react` icons and existing utility `cn`; avoid adding dependencies.
- Keep visual assets code-native for this page: Tailwind panels, icons, subtle CSS motion, and dashboard-derived mini visualizations.

## Interface And Behavior

- `/` becomes the landing page.
- `/dashboard` runs the existing "Run Supply-Chain Attack Scenario" experience unchanged.
- Primary CTA: "Run Live Scenario" linking to `/dashboard`.
- Secondary CTA: anchor link to the agent-system section, such as "View Agent Swarm."
- Landing page is static/client-light; no OpenAI call should run until the user enters the dashboard and starts the scenario.
- Preserve backend API behavior at `POST /api/investigate`.

## Visual Direction

- Use the dashboard's existing design language:
  - Dark background with fixed noise overlay.
  - Thin borders, inset red critical accents, compact enterprise panels.
  - Mono uppercase metadata labels.
  - Ember for critical state, mint for successful automation, cobalt/violet/amber for agent categories.
  - Subtle `fadeUp`, `sweep`, and pulse-style motion already defined in Tailwind.
- Avoid generic marketing layout patterns: no oversized gradient hero, no floating orb background, no soft pastel SaaS look.
- Use a full-width operational composition with constrained inner content, not nested cards.
- Add motion interactivity 

## Test Plan

- Run `npm run typecheck`.
- Run `npm run lint`.
- Run `npm run build`.
- Start the app and manually verify:
  - `/` renders the landing page.
  - `/dashboard` renders the existing dashboard.
  - "Run Live Scenario" navigates to `/dashboard`.
  - Existing Run Scenario and Reset behavior still work.
  - Responsive layout does not overflow on mobile.
- If available, run `npm run e2e:responsive` after route changes.

## Assumptions

- The landing page should be a product/demo entry page, not a separate marketing site with pricing, auth, or signup.
- The current dashboard functionality should remain unchanged after moving to `/dashboard`.
- No new dependencies, auth, database, GitHub integration, or OpenAI frontend calls should be introduced.

