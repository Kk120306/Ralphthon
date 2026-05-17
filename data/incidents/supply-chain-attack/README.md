# Supply-Chain Attack — Raw Mock Data

Realistic **raw logs** for Sentinel Swarm agents. Nothing in the agent-facing files labels the incident as an attack.

## Layout

```
supply-chain-attack/
├── incident.json           # Metadata + investigation window
├── authEvents.json         # Okta-style logs
├── secretsEvents.json      # Vault audit logs
├── githubEvents.json       # GitHub audit / push events
├── cicdEvents.json         # GitHub Actions runs
├── networkEvents.json      # VPC flow logs
├── threatIntel.json        # IOC aggregator feed
├── packageManifests.json   # package.json before/after snapshots
└── expected/               # DO NOT send to OpenAI agents
    ├── mitreMapping.json
    ├── attackChain.json
    └── outcome.json
```

## Regenerate

```bash
python3 scripts/generate-mock-incident-data.py
```

## Embedded signals (for builders — agents must find these)

| Time (+08:00) | Signal |
|---------------|--------|
| 09:12 | `alex.chen@acmefin.dev` login from `185.199.108.153` / Moscow / unknown Linux Chrome device |
| 09:18 | `PROD_PAYMENT_GATEWAY_KEY` read from same IP |
| 09:31 | Push `a4f91c2e8b3d` — message `minor utility cleanup` |
| 09:32 | `package.json` gains `lodash-utilz` (see `packageManifests.json`) |
| 09:36 | `deploy-production` succeeds for `a4f91c2e8b3d` |
| 09:52 | ~10.4GB HTTPS egress `10.0.4.22` → `45.77.88.21` |

## Red herrings

- Intern denied read on prod payment secret (09:02)
- Marcus login from London (approved travel)
- Flaky unit test failure on unrelated commit
- ~890MB upload to Cloudflare (approved log drain)
