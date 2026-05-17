# SPEC.md — Sentinel Swarm Product Specification

## Tagline

Autonomous AI SOC for Startups

## One-Liner

Sentinel Swarm turns fragmented startup security alerts into a coordinated AI investigation.

## Executive Summary

Sentinel Swarm is an OpenAI-powered cybersecurity operations demo for startups.

It simulates how a real security team investigates an incident by using specialized AI agents to analyze different evidence sources: authentication logs, secret access logs, repository activity, dependency changes, and network traffic logs.

A Master Correlation Agent connects the findings into one clear attack story, identifies the likely root cause, scores the severity, maps the behavior to MITRE ATT&CK techniques, and generates a remediation plan.

The MVP uses mock security data but real AI analysis.

## Problem

Startups generate security signals across many systems — identity providers, GitHub, CI/CD, cloud infrastructure, secrets managers, and network logs.

But these alerts are usually noisy, disconnected, hard to prioritize, and spread across tools.

Most startups do not have a full Security Operations Center team.

This means coordinated attacks can be missed because each individual alert looks small.

## Solution

Sentinel Swarm acts like an AI-powered security team.

Specialized agents investigate individual evidence sources. A Master Correlation Agent connects the dots.

Instead of showing isolated alerts, Sentinel Swarm reconstructs the full attack chain.

## MVP Scenario

Supply-chain attack caused by a compromised developer account.

Incident sequence:
1. Developer account logs in from an unusual location and device
2. Secrets are accessed shortly after login
3. Suspicious dependency is added to the codebase
4. Large outbound transfer occurs to an unapproved destination
5. Master Agent correlates the evidence
6. Remediation Agent creates a response plan

## Product Agents

### 1. Intake Agent
Triage raw alerts. Deduplicate. Group related signals. Assign initial severity. Decide whether escalation is needed.

### 2. Auth Agent
Detect unusual login location, unknown device, suspicious timing, and suspicious access to secrets after login.

### 3. Code Agent
Detect suspicious dependency additions, typosquatting-style package names, and unusual commits after suspicious login.

### 4. Network Agent
Detect large outbound transfers, unapproved destination IPs, and possible exfiltration. Mention uncertainty where evidence is incomplete.

### 5. Master Correlation Agent
Aggregate findings. Correlate timing. Reconstruct attack chain. Identify root cause. Assign final severity and confidence.

### 6. Remediation Agent
Generate containment, eradication, recovery, and post-incident actions. Output final remediation checklist.

## Required Dashboard Sections

- Header (product name + tagline)
- Incident selector
- Run Scenario button
- Reset button
- Agent status cards (one per agent)
- Live reasoning feed
- Risk score panel with animated progression
- Attack chain visualization (nodes activate step by step)
- MITRE ATT&CK mapping cards
- Remediation checklist
- Final incident report

## UI Style

Dark mode. Enterprise SaaS. Cybersecurity aesthetic.
Reference: Linear, Datadog, CrowdStrike, Wiz, Vercel.
Primary visual reference: `Dashboard.png`. The frontend should follow its dashboard composition, dark SOC styling, dense panels, red critical states, agent reasoning stream, right-side incident report/remediation column, and enterprise-grade polish.
Keywords: clean, serious, high-signal, premium, not cartoonish.

## Non-Goals

Do not build:
- Real GitHub OAuth
- Real log ingestion
- Real cloud integration
- Real secrets manager integration
- Real user accounts
- Real database
- Billing
- Production deployment system

## Success Criteria

The demo succeeds if the audience understands:
1. Multiple weak alerts appeared
2. Different AI agents investigated different evidence
3. The Master Agent correlated the evidence
4. The system identified a compromised developer account as root cause
5. The system generated concrete remediation actions
