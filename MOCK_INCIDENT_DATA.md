# MOCK_INCIDENT_DATA.md

## Scenario

Supply-chain attack caused by compromised developer account.

## Company

Name: AcmeFin
Type: Small fintech startup
Environment: GitHub repo, CI/CD pipeline, cloud-hosted API, secrets manager, production API keys, basic network logging

## Timeline

### Event 1 — Suspicious Login

Time: 2026-05-17T09:12:00+08:00

Developer account "alex.chen@acmefin.dev" logged in from IP 185.199.108.153 using a new device.

Details:
- Location: Moscow, Russia
- Usual location: Singapore
- Device: Unknown Chrome on Linux
- MFA: Passed
- Risk: Medium

### Event 2 — Secret Access

Time: 2026-05-17T09:18:00+08:00

Production API keys accessed from secrets manager.

Details:
- User: alex.chen@acmefin.dev
- Secret: PROD_PAYMENT_GATEWAY_KEY
- Normal access frequency: rare
- Last access before this: 42 days ago
- Risk: High

### Event 3 — Suspicious Dependency Added

Time: 2026-05-17T09:31:00+08:00

New dependency "lodash-utilz" added to package.json.

Details:
- Looks similar to trusted package: lodash-utils
- Added by: alex.chen@acmefin.dev
- Commit message: "minor utility cleanup"
- Files changed: package.json, package-lock.json
- Risk: High

### Event 4 — CI/CD Pipeline Triggered

Time: 2026-05-17T09:36:00+08:00

Production deployment pipeline triggered after dependency update.

Details:
- Branch: main
- Triggered by: dependency update commit
- Tests passed
- Deployment completed
- Risk: Medium

### Event 5 — Large Outbound Transfer

Time: 2026-05-17T09:52:00+08:00

10.4GB outbound transfer detected from production API server.

Details:
- Destination IP: 45.77.88.21
- Destination country: unknown/unapproved
- Historical average outbound transfer: 400MB/hour
- Protocol: HTTPS
- Risk: Critical

## Expected Root Cause

Compromised developer account (alex.chen@acmefin.dev)

## Expected Attack Chain

Credential Theft → Secret Access → Malicious Dependency → Data Exfiltration

## Expected Final Severity

Critical

## Expected Confidence

84%

## Expected MITRE Mappings

- T1078 — Valid Accounts
- T1552 — Unsecured Credentials
- T1195 — Supply Chain Compromise
- T1041 — Exfiltration Over C2 Channel

## Machine-Readable Data

Raw log exports for agent investigation (no pre-labeled alerts or summaries):

**Directory:** `data/incidents/supply-chain-attack/`

| File | Agent input? | Description |
|------|----------------|-------------|
| `incident.json` | Yes | Org metadata and investigation time window only |
| `authEvents.json` | Yes | Okta-style authentication logs (~300+ events) |
| `secretsEvents.json` | Yes | Vault audit logs |
| `githubEvents.json` | Yes | Push/PR audit events |
| `cicdEvents.json` | Yes | GitHub Actions workflow runs |
| `networkEvents.json` | Yes | VPC flow logs (high volume + baseline stats) |
| `threatIntel.json` | Yes | IOC feed (mostly benign; relevant IOCs embedded) |
| `packageManifests.json` | Yes | `package.json` snapshots before/after suspicious commit |
| `expected/mitreMapping.json` | **No** | Ground truth for fallback/demo validation |
| `expected/attackChain.json` | **No** | Expected attack phases |
| `expected/outcome.json` | **No** | Expected root cause, severity, remediation |

Regenerate all files: `python3 scripts/generate-mock-incident-data.py`

**Runtime loading:** `lib/mockIncident.ts` reads these JSON files; `lib/runInvestigation.ts` passes window-filtered slices to each agent via `POST /api/investigate`. Ground truth for fallback lives only in `expected/`.

Agents must discover anomalies in raw logs (e.g. Moscow login, dormant prod secret read, `lodash-utilz`, 10.4GB egress to `45.77.88.21`). Small red herrings are included (failed intern vault access, flaky CI, approved CDN upload).

## Expected Remediation Actions

- Disable compromised developer account
- Rotate production API keys
- Remove suspicious dependency (lodash-utilz)
- Pause deployment pipeline
- Block suspicious outbound IP (45.77.88.21)
- Review recent commits on main branch
- Audit secrets access logs
- Notify engineering and security team
- Generate post-incident report
