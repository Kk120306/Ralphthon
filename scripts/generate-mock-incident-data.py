#!/usr/bin/env python3
"""Generate realistic mock SOC data with embedded incident signals (not pre-labeled alerts)."""

import json
import random
from datetime import datetime, timedelta
from pathlib import Path

random.seed(42)

OUT = Path(__file__).resolve().parent.parent / "data" / "incidents" / "supply-chain-attack"
EXPECTED = OUT / "expected"

# Ground truth anchors (MOCK_INCIDENT_DATA.md)
INCIDENT_DAY = datetime(2026, 5, 17, 0, 0, 0)
TZ = "+08:00"

def ts(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%S") + TZ

def write(name: str, data, subdir: Path | None = None):
    path = (subdir or OUT) / name
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w") as f:
        json.dump(data, f, indent=2)
    print(f"  wrote {path} ({path.stat().st_size // 1024} KB)")


def generate_auth_events():
    events = []
    users = [
        ("alex.chen@acmefin.dev", "Singapore", "SG", True),
        ("priya.sharma@acmefin.dev", "Singapore", "SG", True),
        ("marcus.lee@acmefin.dev", "Singapore", "SG", True),
        ("deploy-bot@acmefin.dev", "Singapore", "SG", True),
        ("sana.khan@acmefin.dev", "Singapore", "SG", True),
        ("intern.jordan@acmefin.dev", "Singapore", "SG", False),
    ]
    devices_known = {
        "alex.chen@acmefin.dev": "fp_macbook_safari_acme_01",
        "priya.sharma@acmefin.dev": "fp_macbook_chrome_acme_02",
        "marcus.lee@acmefin.dev": "fp_win11_edge_acme_03",
        "deploy-bot@acmefin.dev": "fp_github_actions_runner",
        "sana.khan@acmefin.dev": "fp_iphone_okta_verify",
        "intern.jordan@acmefin.dev": "fp_macbook_chrome_intern",
    }

    eid = 0
    for day_offset in range(14, -1, -1):
        base = INCIDENT_DAY - timedelta(days=day_offset)
        for hour in [7, 8, 9, 10, 11, 12, 14, 16, 17, 18, 20]:
            for user, city, cc, _ in random.sample(users, k=random.randint(3, 5)):
                eid += 1
                t = base.replace(hour=hour, minute=random.randint(0, 59), second=random.randint(0, 59))
                events.append({
                    "id": f"okta-ev-{eid:05d}",
                    "timestamp": ts(t),
                    "eventType": "user.session.start",
                    "outcome": "SUCCESS",
                    "actor": {"id": user.split("@")[0], "email": user, "type": "User"},
                    "client": {
                        "ipAddress": f"103.{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}",
                        "geographicalContext": {"city": city, "country": cc},
                        "device": devices_known.get(user, "fp_unknown"),
                        "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
                    },
                    "authenticationContext": {
                        "authenticationProvider": "OKTA",
                        "credentialProvider": "OKTA",
                        "authenticationStep": 0,
                        "externalSessionId": f"sess_{eid:08x}",
                    },
                    "securityContext": {"isPrivileged": user == "deploy-bot@acmefin.dev"},
                    "debugContext": {"requestId": f"req_{eid:08x}"},
                })

    # --- Embedded signal: anomalous login (no alert labels) ---
    attack_login = INCIDENT_DAY.replace(hour=9, minute=12, second=0)
    events.append({
        "id": "okta-ev-31847",
        "timestamp": ts(attack_login),
        "eventType": "user.session.start",
        "outcome": "SUCCESS",
        "actor": {"id": "alex.chen", "email": "alex.chen@acmefin.dev", "type": "User"},
        "client": {
            "ipAddress": "185.199.108.153",
            "geographicalContext": {"city": "Moscow", "state": "Moscow", "country": "RU", "postalCode": None},
            "device": "fp_unknown_linux_chrome_9c2e",
            "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
        },
        "authenticationContext": {
            "authenticationProvider": "OKTA",
            "credentialProvider": "OKTA",
            "authenticationStep": 0,
            "externalSessionId": "sess_7k3m9p2q",
        },
        "securityContext": {"isPrivileged": False, "riskLevel": None},
        "debugContext": {"requestId": "req_8f2c91a0"},
        "mfaEvent": {
            "timestamp": ts(attack_login + timedelta(seconds=4)),
            "eventType": "user.authentication.auth_via_mfa",
            "outcome": "SUCCESS",
            "factor": "push",
        },
    })

    # Minor noise issues
    events.append({
        "id": "okta-ev-noise-001",
        "timestamp": ts(INCIDENT_DAY.replace(hour=8, minute=47, second=12)),
        "eventType": "user.session.start",
        "outcome": "FAILURE",
        "actor": {"id": "intern.jordan", "email": "intern.jordan@acmefin.dev", "type": "User"},
        "client": {"ipAddress": "103.22.11.88", "geographicalContext": {"city": "Singapore", "country": "SG"}, "device": "fp_macbook_chrome_intern"},
        "failureReason": "INVALID_CREDENTIALS",
    })
    events.append({
        "id": "okta-ev-noise-002",
        "timestamp": ts(INCIDENT_DAY.replace(hour=9, minute=5, second=33)),
        "eventType": "user.session.start",
        "outcome": "SUCCESS",
        "actor": {"id": "marcus.lee", "email": "marcus.lee@acmefin.dev", "type": "User"},
        "client": {
            "ipAddress": "198.51.100.44",
            "geographicalContext": {"city": "London", "country": "GB"},
            "device": "fp_win11_edge_acme_03",
        },
        "note": "Approved travel — Marcus at vendor onsite week of May 12",
    })

    events.sort(key=lambda x: x["timestamp"])
    return {
        "source": "okta_system_log",
        "exportedAt": ts(INCIDENT_DAY.replace(hour=12, minute=0)),
        "organization": "acmefin",
        "timeRange": {"from": ts(INCIDENT_DAY - timedelta(days=7)), "to": ts(INCIDENT_DAY.replace(hour=11, minute=59))},
        "recordCount": len(events),
        "events": events,
    }


def generate_secrets_events():
    events = []
    secrets_catalog = [
        ("secret/data/dev/stripe-test", "STRIPE_TEST_KEY", "dev"),
        ("secret/data/staging/db-password", "STAGING_DB_PASSWORD", "staging"),
        ("secret/data/prod/payment-gateway", "PROD_PAYMENT_GATEWAY_KEY", "production"),
        ("secret/data/prod/jwt-signing", "PROD_JWT_SIGNING_KEY", "production"),
        ("secret/data/shared/slack-webhook", "SLACK_WEBHOOK_OPS", "shared"),
        ("secret/data/prod/redis-auth", "PROD_REDIS_AUTH", "production"),
    ]
    actors = [
        "alex.chen@acmefin.dev",
        "priya.sharma@acmefin.dev",
        "deploy-bot@acmefin.dev",
        "marcus.lee@acmefin.dev",
    ]
    eid = 0
    for day_offset in range(21, -1, -1):
        base = INCIDENT_DAY - timedelta(days=day_offset)
        for _ in range(random.randint(5, 12)):
            eid += 1
            path, name, env = random.choice(secrets_catalog)
            actor = random.choice(actors)
            t = base.replace(hour=random.randint(8, 20), minute=random.randint(0, 59))
            events.append({
                "id": f"vault-audit-{eid:05d}",
                "timestamp": ts(t),
                "type": random.choice(["secret.read", "secret.read", "secret.list"]),
                "auth": {"accessor": actor, "policies": [f"team-{env}-read"], "tokenTtl": 3600},
                "request": {"path": path, "operation": "read", "remoteAddress": "10.0.2." + str(random.randint(10, 50))},
                "secret": {"name": name, "version": random.randint(1, 5), "environment": env},
                "response": {"status": 200},
            })

    # Attack signal — prod payment key after long dormancy
    events.append({
        "id": "vault-audit-29401",
        "timestamp": ts(INCIDENT_DAY.replace(hour=9, minute=18, second=0)),
        "type": "secret.read",
        "auth": {
            "accessor": "alex.chen@acmefin.dev",
            "policies": ["engineer-prod-read"],
            "tokenTtl": 3600,
            "entityId": "oidc/alex.chen",
        },
        "request": {
            "path": "secret/data/prod/payment-gateway",
            "operation": "read",
            "remoteAddress": "185.199.108.153",
        },
        "secret": {"name": "PROD_PAYMENT_GATEWAY_KEY", "version": 12, "environment": "production"},
        "response": {"status": 200},
    })

    # Minor issues
    events.append({
        "id": "vault-audit-noise-001",
        "timestamp": ts(INCIDENT_DAY.replace(hour=9, minute=2, second=41)),
        "type": "secret.read",
        "auth": {"accessor": "intern.jordan@acmefin.dev", "policies": ["intern-staging-read"]},
        "request": {"path": "secret/data/prod/payment-gateway", "operation": "read"},
        "response": {"status": 403, "error": "permission denied"},
    })
    events.append({
        "id": "vault-audit-noise-002",
        "timestamp": ts(INCIDENT_DAY.replace(hour=10, minute=15, second=0)),
        "type": "secret.read",
        "auth": {"accessor": "deploy-bot@acmefin.dev"},
        "request": {"path": "secret/data/prod/jwt-signing", "operation": "read"},
        "secret": {"name": "PROD_JWT_SIGNING_KEY", "environment": "production"},
        "response": {"status": 200},
        "note": "Routine deploy rotation check — expected",
    })

    events.sort(key=lambda x: x["timestamp"])
    return {
        "source": "hashicorp_vault_audit",
        "exportedAt": ts(INCIDENT_DAY.replace(hour=12, minute=0)),
        "mount": "secret/",
        "recordCount": len(events),
        "events": events,
    }


def generate_github_events():
    events = []
    repo = "acmefin/payments-api"
    contributors = [
        ("alexchen-acme", "alex.chen@acmefin.dev"),
        ("priya-acme", "priya.sharma@acmefin.dev"),
        ("marcus-acme", "marcus.lee@acmefin.dev"),
        ("dependabot[bot]", "dependabot@noreply.github.com"),
    ]
    messages = [
        ("fix: invoice rounding edge case", ["src/billing/invoice.ts"]),
        ("chore: bump axios to 1.7.2", ["package.json", "package-lock.json"]),
        ("feat: add webhook retry queue", ["src/webhooks/retry.ts", "package.json"]),
        ("docs: update API rate limits", ["README.md"]),
        ("test: increase coverage on auth middleware", ["tests/auth.test.ts"]),
        ("refactor: extract payment client", ["src/payments/client.ts"]),
    ]

    eid = 0
    for day_offset in range(21, 0, -1):
        base = INCIDENT_DAY - timedelta(days=day_offset)
        for _ in range(random.randint(4, 9)):
            eid += 1
            login, email = random.choice(contributors)
            msg, files = random.choice(messages)
            t = base.replace(hour=random.randint(9, 18), minute=random.randint(0, 59))
            sha = f"{random.randint(0x100000, 0xffffff):06x}{random.randint(0x100000, 0xffffff):06x}"[:12]
            branch = random.choice(["main", "feat/webhook-retry", "fix/invoice-rounding", "chore/deps"])
            events.append({
                "id": f"gh-{eid:05d}",
                "timestamp": ts(t),
                "type": "PushEvent",
                "repo": repo,
                "actor": {"login": login, "email": email},
                "payload": {
                    "ref": f"refs/heads/{branch}",
                    "commits": [{
                        "sha": sha,
                        "message": msg,
                        "author": {"email": email},
                        "added": [f for f in files if "package" in f or random.random() > 0.7],
                        "modified": files,
                        "removed": [],
                    }],
                    "size": random.randint(1, 8),
                },
            })

    # Attack commit — innocuous message, typosquat dep
    events.append({
        "id": "gh-48291",
        "timestamp": ts(INCIDENT_DAY.replace(hour=9, minute=31, second=0)),
        "type": "PushEvent",
        "repo": repo,
        "actor": {"login": "alexchen-acme", "email": "alex.chen@acmefin.dev"},
        "payload": {
            "ref": "refs/heads/main",
            "commits": [{
                "sha": "a4f91c2e8b3d",
                "message": "minor utility cleanup",
                "author": {"email": "alex.chen@acmefin.dev", "name": "Alex Chen"},
                "added": [],
                "modified": ["package.json", "package-lock.json"],
                "removed": [],
            }],
            "size": 2,
        },
    })

    # Minor issues — not attack
    events.append({
        "id": "gh-noise-001",
        "timestamp": ts(INCIDENT_DAY.replace(hour=9, minute=28, second=0)),
        "type": "PushEvent",
        "repo": repo,
        "actor": {"login": "dependabot[bot]", "email": "dependabot@noreply.github.com"},
        "payload": {
            "ref": "refs/heads/dependabot/npm_and_yarn/express-4.21.0",
            "commits": [{"sha": "b8e21a0c1f2d", "message": "chore(deps): bump express from 4.20.2 to 4.21.0", "modified": ["package.json"]}],
        },
    })
    events.append({
        "id": "gh-noise-002",
        "timestamp": ts(INCIDENT_DAY.replace(hour=8, minute=55, second=0)),
        "type": "PullRequestEvent",
        "repo": repo,
        "actor": {"login": "priya-acme", "email": "priya.sharma@acmefin.dev"},
        "payload": {"action": "opened", "number": 1842, "title": "fix: settlement report timezone", "base": "main"},
    })

    events.sort(key=lambda x: x["timestamp"])
    return {
        "source": "github_audit_log",
        "exportedAt": ts(INCIDENT_DAY.replace(hour=12, minute=0)),
        "repository": repo,
        "recordCount": len(events),
        "events": events,
    }


def generate_cicd_events():
    events = []
    workflows = [
        ("ci-pr-checks", "pull_request"),
        ("ci-main-build", "push"),
        ("deploy-staging", "push"),
        ("deploy-production", "push"),
        ("nightly-security-scan", "schedule"),
    ]
    eid = 0
    for day_offset in range(14, -1, -1):
        base = INCIDENT_DAY - timedelta(days=day_offset)
        for wf, trigger in workflows:
            runs = 2 if wf == "ci-pr-checks" else 1
            for _ in range(runs):
                if wf == "nightly-security-scan" and day_offset % 2:
                    continue
                eid += 1
                t = base.replace(hour=random.randint(7, 22), minute=random.randint(0, 59))
                conclusion = random.choices(
                    ["success", "success", "success", "failure"], weights=[85, 85, 85, 15]
                )[0]
                events.append({
                    "id": f"gha-{eid:05d}",
                    "timestamp": ts(t),
                    "platform": "github_actions",
                    "workflow": wf,
                    "runId": str(18000000000 + eid),
                    "repository": "acmefin/payments-api",
                    "trigger": trigger,
                    "branch": random.choice(
                        ["main", "feat/webhook-retry", "dependabot/npm_and_yarn/express-4.21.0"]
                    ),
                    "commitSha": f"{random.randint(0, 0xffffff):06x}{random.randint(0, 0xffffff):06x}"[:12],
                    "conclusion": conclusion,
                    "durationSeconds": random.randint(45, 420),
                    "jobs": {
                        "lint": "success",
                        "unit-tests": "success" if conclusion == "success" else "failure",
                        "build": "success" if conclusion == "success" else "skipped",
                    },
                })

    # Production deploy after dependency push on incident day
    events.append({
        "id": "gha-91024",
        "timestamp": ts(INCIDENT_DAY.replace(hour=9, minute=36, second=0)),
        "platform": "github_actions",
        "workflow": "deploy-production",
        "runId": "18472930112",
        "repository": "acmefin/payments-api",
        "trigger": "push",
        "branch": "main",
        "commitSha": "a4f91c2e8b3d",
        "commitMessage": "minor utility cleanup",
        "triggeredBy": "alex.chen@acmefin.dev",
        "conclusion": "success",
        "durationSeconds": 312,
        "jobs": {
            "lint": "success",
            "unit-tests": "success",
            "integration-tests": "success",
            "build-image": "success",
            "deploy-k8s": "success",
        },
        "deployment": {
            "environment": "production",
            "cluster": "acmefin-prod-ap-southeast-1",
            "namespace": "payments",
            "workload": "api-prod-01",
            "image": "ghcr.io/acmefin/payments-api:a4f91c2",
            "completedAt": ts(INCIDENT_DAY.replace(hour=9, minute=36, second=48)),
        },
        "security": {
            "dependencyAudit": "not_run",
            "newPackageAllowlistCheck": False,
            "containerScan": "passed",
        },
    })

    # Minor CI issues
    events.append({
        "id": "gha-noise-001",
        "timestamp": ts(INCIDENT_DAY.replace(hour=9, minute=20, second=0)),
        "platform": "github_actions",
        "workflow": "ci-main-build",
        "runId": "18472891002",
        "repository": "acmefin/payments-api",
        "trigger": "push",
        "branch": "main",
        "commitSha": "c3d81f0a2b1e",
        "conclusion": "failure",
        "durationSeconds": 198,
        "jobs": {"unit-tests": "failure"},
        "logsExcerpt": "FAIL tests/webhooks/retry.test.ts — timeout after 5000ms (flaky; rerun passed)",
    })

    events.sort(key=lambda x: x["timestamp"])
    return {
        "source": "github_actions_workflow_runs",
        "exportedAt": ts(INCIDENT_DAY.replace(hour=12, minute=0)),
        "recordCount": len(events),
        "events": events,
    }


def generate_network_events():
    events = []
    approved_dests = [
        ("52.84.0.0/15", "aws-cloudfront", 443),
        ("54.187.0.0/16", "stripe-api", 443),
        ("142.250.0.0/15", "google-apis", 443),
        ("10.0.1.5", "internal-postgres", 5432),
        ("10.0.1.12", "internal-redis", 6379),
    ]
    eid = 0
    window_start = INCIDENT_DAY.replace(hour=8, minute=0)
    window_end = INCIDENT_DAY.replace(hour=11, minute=0)

    t = window_start
    while t < window_end:
        for _ in range(random.randint(18, 28)):
            eid += 1
            dest, label, port = random.choice(approved_dests)
            bytes_out = random.randint(1024, 45_000_000)
            events.append({
                "id": f"flow-{eid:06d}",
                "timestamp": ts(t + timedelta(seconds=random.randint(0, 59))),
                "srcAddr": "10.0.4.22",
                "srcHostname": "api-prod-01.payments.svc.cluster.local",
                "dstAddr": dest.split("/")[0] if "/" not in dest else "52.84.12.44",
                "dstPort": port,
                "protocol": "TCP" if port != 443 else "HTTPS",
                "bytesOut": bytes_out,
                "bytesIn": random.randint(512, 500_000),
                "packets": random.randint(10, 5000),
                "action": "ACCEPT",
                "vpcId": "vpc-acmefin-prod-01",
                "flowDirection": "egress",
                "tag": label,
            })
        t += timedelta(minutes=5)

    # Attack exfil — large HTTPS to unknown IP
    events.append({
        "id": "flow-910882",
        "timestamp": ts(INCIDENT_DAY.replace(hour=9, minute=52, second=0)),
        "srcAddr": "10.0.4.22",
        "srcHostname": "api-prod-01.payments.svc.cluster.local",
        "dstAddr": "45.77.88.21",
        "dstPort": 443,
        "protocol": "HTTPS",
        "bytesOut": 11166914969,
        "bytesIn": 8421,
        "packets": 8234192,
        "action": "ACCEPT",
        "vpcId": "vpc-acmefin-prod-01",
        "flowDirection": "egress",
        "tag": None,
        "dstHostname": None,
        "geo": {"country": None, "registered": False},
    })

    # Minor anomalies
    events.append({
        "id": "flow-noise-001",
        "timestamp": ts(INCIDENT_DAY.replace(hour=9, minute=44, second=0)),
        "srcAddr": "10.0.4.22",
        "dstAddr": "104.18.32.68",
        "dstPort": 443,
        "protocol": "HTTPS",
        "bytesOut": 890_000_000,
        "bytesIn": 12000,
        "action": "ACCEPT",
        "tag": "cloudflare-cdn-log-drain",
        "note": "Scheduled log archive upload — approved destination",
    })
    events.append({
        "id": "flow-noise-002",
        "timestamp": ts(INCIDENT_DAY.replace(hour=9, minute=10, second=0)),
        "srcAddr": "10.0.4.21",
        "dstAddr": "8.8.8.8",
        "dstPort": 53,
        "protocol": "UDP",
        "bytesOut": 512,
        "action": "ACCEPT",
        "tag": "dns-healthcheck",
    })

    events.sort(key=lambda x: x["timestamp"])
    return {
        "source": "aws_vpc_flow_logs",
        "logGroup": "/aws/vpc/acmefin-prod-flow",
        "exportedAt": ts(INCIDENT_DAY.replace(hour=12, minute=0)),
        "filter": "srcAddr = 10.0.4.22 OR srcAddr = 10.0.4.21",
        "baseline": {
            "hourlyEgressBytesP50": 419430400,
            "hourlyEgressBytesP95": 1200000000,
            "description": "Production API subnet egress — 7-day rolling",
        },
        "recordCount": len(events),
        "events": events,
    }


def generate_threat_intel():
    indicators = []
    # Benign bulk
    for i in range(40):
        indicators.append({
            "type": "ipv4",
            "value": f"52.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}",
            "confidence": random.randint(0, 15),
            "tags": ["aws", "cdn", "benign"],
            "lastSeen": "2026-05-01",
        })
    for pkg in ["axios", "express", "react", "typescript", "lodash", "moment", "request"]:
        indicators.append({
            "type": "npm_package",
            "value": pkg,
            "confidence": random.randint(0, 10),
            "tags": ["popular_oss"],
            "weeklyDownloads": random.randint(1_000_000, 50_000_000),
        })
    # Relevant IOCs (agents must correlate with logs)
    indicators.extend([
        {"type": "ipv4", "value": "185.199.108.153", "confidence": 72, "tags": ["residential_proxy", "credential_access"], "lastSeen": "2026-05-10"},
        {"type": "ipv4", "value": "45.77.88.21", "confidence": 91, "tags": ["exfiltration", "bulletproof_hosting"], "lastSeen": "2026-05-16", "relatedMalware": ["FIN-EXFIL-BUCKET-17"]},
        {"type": "domain", "value": "cdn-utilz-fast.io", "confidence": 88, "tags": ["c2"], "lastSeen": "2026-05-14"},
        {"type": "npm_package", "value": "lodash-utilz", "confidence": 94, "tags": ["typosquat", "supply_chain"], "legitimatePackage": "lodash-utils", "firstPublished": "2026-04-30", "weeklyDownloads": 127},
        {"type": "npm_package", "value": "lodash-utils", "confidence": 3, "tags": ["popular_oss"], "weeklyDownloads": 890000},
    ])
    return {
        "source": "acmefin_threat_intel_aggregator",
        "exportedAt": ts(INCIDENT_DAY.replace(hour=12, minute=0)),
        "feeds": ["mock-ti-commercial", "oss-malware-packages", "community-egress-blocklist", "npm-reputation"],
        "indicatorCount": len(indicators),
        "indicators": indicators,
    }


def generate_expected():
    return {
        "mitreMapping": [
            {"id": "T1078", "name": "Valid Accounts", "tactic": "Initial Access", "linkedEvidenceHints": ["okta-ev-31847", "185.199.108.153"]},
            {"id": "T1552", "name": "Unsecured Credentials", "tactic": "Credential Access", "linkedEvidenceHints": ["vault-audit-29401", "PROD_PAYMENT_GATEWAY_KEY"]},
            {"id": "T1195", "name": "Supply Chain Compromise", "tactic": "Initial Access", "linkedEvidenceHints": ["gh-48291", "a4f91c2e8b3d", "lodash-utilz"]},
            {"id": "T1041", "name": "Exfiltration Over C2 Channel", "tactic": "Exfiltration", "linkedEvidenceHints": ["flow-910882", "45.77.88.21"]},
        ],
        "attackChain": [
            {"order": 1, "phase": "Credential Theft", "approxTime": "2026-05-17T09:12:00+08:00"},
            {"order": 2, "phase": "Secret Access", "approxTime": "2026-05-17T09:18:00+08:00"},
            {"order": 3, "phase": "Malicious Dependency", "approxTime": "2026-05-17T09:31:00+08:00"},
            {"order": 4, "phase": "Data Exfiltration", "approxTime": "2026-05-17T09:52:00+08:00"},
        ],
        "outcome": {
            "rootCause": "Compromised developer account (alex.chen@acmefin.dev)",
            "severity": "Critical",
            "confidence": 84,
            "riskScore": 84,
            "incidentType": "Supply-Chain Attack",
        },
        "remediation": [
            "Disable compromised developer account",
            "Rotate production API keys",
            "Remove suspicious dependency (lodash-utilz)",
            "Pause deployment pipeline",
            "Block suspicious outbound IP (45.77.88.21)",
            "Review recent commits on main branch",
            "Audit secrets access logs",
            "Notify engineering and security team",
            "Generate post-incident report",
        ],
        "_note": "For demo validation and fallback only — do not pass to investigation agents",
    }


def main():
    print("Generating mock incident data...")
    write("incident.json", {
        "id": "INC-2026-0517-ACME-001",
        "scenarioId": "supply-chain-attack",
        "organization": {
            "name": "AcmeFin",
            "domain": "acmefin.dev",
            "industry": "Fintech",
            "size": "startup",
        },
        "investigationWindow": {
            "from": ts(INCIDENT_DAY.replace(hour=8, minute=0)),
            "to": ts(INCIDENT_DAY.replace(hour=11, minute=0)),
            "timezone": "Asia/Singapore",
        },
        "dataSources": [
            "authEvents.json",
            "secretsEvents.json",
            "githubEvents.json",
            "cicdEvents.json",
            "networkEvents.json",
            "threatIntel.json",
            "packageManifests.json",
        ],
        "validationOnly": [
            "expected/mitreMapping.json",
            "expected/attackChain.json",
            "expected/outcome.json",
        ],
        "repositories": ["acmefin/payments-api"],
        "productionHosts": ["api-prod-01"],
        "_instructions": "Agents must analyze raw logs below. Findings are not pre-labeled in source files.",
    })
    write("authEvents.json", generate_auth_events())
    write("secretsEvents.json", generate_secrets_events())
    write("githubEvents.json", generate_github_events())
    write("cicdEvents.json", generate_cicd_events())
    write("networkEvents.json", generate_network_events())
    write("threatIntel.json", generate_threat_intel())
    exp = generate_expected()
    write("mitreMapping.json", exp["mitreMapping"], EXPECTED)
    write("attackChain.json", exp["attackChain"], EXPECTED)
    write("outcome.json", {
        "outcome": exp["outcome"],
        "remediation": exp["remediation"],
        "_note": exp["_note"],
    }, EXPECTED)
    write(
        "packageManifests.json",
        {
            "source": "repository_file_snapshot",
            "repository": "acmefin/payments-api",
            "branch": "main",
            "snapshots": [
                {
                    "capturedAt": ts(INCIDENT_DAY.replace(hour=9, minute=25, second=0)),
                    "commitSha": "c3d81f0a2b1e",
                    "package.json": {
                        "name": "payments-api",
                        "version": "2.14.0",
                        "dependencies": {
                            "express": "^4.21.0",
                            "lodash-utils": "^1.2.0",
                            "stripe": "^14.0.0",
                            "pg": "^8.11.0",
                        },
                    },
                },
                {
                    "capturedAt": ts(INCIDENT_DAY.replace(hour=9, minute=32, second=0)),
                    "commitSha": "a4f91c2e8b3d",
                    "package.json": {
                        "name": "payments-api",
                        "version": "2.14.0",
                        "dependencies": {
                            "express": "^4.21.0",
                            "lodash-utils": "^1.2.0",
                            "lodash-utilz": "^2.1.4",
                            "stripe": "^14.0.0",
                            "pg": "^8.11.0",
                        },
                    },
                },
            ],
        },
    )
    print("Done.")


if __name__ == "__main__":
    main()
