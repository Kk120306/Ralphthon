# DEMO_FLOW.md

## Opening Hook

"Imagine a small startup without a dedicated security team.

They have logs from authentication, GitHub, cloud infrastructure, and network traffic.

Individually, each alert looks small.

But together, they reveal a serious supply-chain attack.

Sentinel Swarm acts like an autonomous AI SOC team that investigates and connects the dots."

## Demo Step 1 — Idle Dashboard (0:00)

Show the dashboard before running the scenario.

"At first, nothing looks obviously dangerous. Like in a real startup, the system is watching multiple weak signals across different tools."

## Demo Step 2 — Run Scenario (0:20)

Click: Run Supply-Chain Attack Scenario

"Now the system receives several weak alerts: a suspicious login, secret access, a dependency change, and unusual outbound traffic."

## Demo Step 3 — Intake Agent (0:30)

"The Intake Agent acts like a first-line SOC analyst. It groups related alerts and decides whether this is worth investigating."

Risk score: 12% → 24%

## Demo Step 4 — Auth Agent (0:45)

"The Auth Agent analyzes login and secret access logs. It finds that a developer account logged in from Russia — when they're usually in Singapore — and accessed production secrets shortly after."

Risk score: 24% → 35%

## Demo Step 5 — Code Agent (1:00)

"The Code Agent analyzes repository activity. It finds that shortly after the suspicious login, a lookalike dependency called 'lodash-utilz' was added — a typosquatted version of the legitimate 'lodash-utils'."

Risk score: 35% → 58%

## Demo Step 6 — Network Agent (1:15)

"The Network Agent analyzes traffic logs and detects a 10.4GB outbound transfer to an unapproved IP — that's 26x the normal hourly rate."

Risk score: 58% → 76%

## Demo Step 7 — Master Correlation Agent (1:30)

"This is the key moment. Each alert alone was suspicious — but the Master Agent connects them into a full attack chain."

Attack chain activates:
Credential Theft → Secret Access → Malicious Dependency → Data Exfiltration

Risk score: 76% → 84% — Critical Risk

## Demo Step 8 — Remediation Agent (1:45)

"The Remediation Agent turns the investigation into concrete response actions: disable the account, rotate keys, remove the dependency, pause deployment, and notify the team."

## Demo Step 9 — Final Report (2:15)

"By the end, Sentinel Swarm has done what a real SOC team would do: detect, investigate, correlate, explain, and recommend action."

Show the final incident report.

## Closing Line (2:30)

"Sentinel Swarm turns fragmented startup security alerts into a coordinated AI investigation — giving small teams the visibility and response capabilities of a full security operations center."

Total demo time: under 3 minutes.
