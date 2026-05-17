# OPENAI_AGENT_DESIGN.md

## Goal

Use OpenAI API to analyze mock security data and produce structured security investigation results.

The mock incident data is static, but the agent reasoning is generated dynamically by the model.

## Recommended Flow

Run in sequence:
1. Intake Agent
2. Auth Agent
3. Code Agent
4. Network Agent
5. Master Correlation Agent
6. Remediation Agent

## Files to Create

- lib/mockIncident.ts
- lib/agentPrompts.ts
- lib/fallbackInvestigation.ts
- app/api/investigate/route.ts

## API Route

POST /api/investigate

Steps:
1. Load mock incident data from lib/mockIncident.ts
2. Check if OPENAI_API_KEY env var exists
3. If key exists: call OpenAI API for each agent in sequence
4. If key missing or API fails: return lib/fallbackInvestigation.ts result
5. Return structured JSON

Do not call OpenAI from the frontend. API key is server-side only.

## Response Shape

```json
{
  "incidentName": "Supply-Chain Attack via Compromised Developer Account",
  "severity": "Critical",
  "riskScore": 84,
  "confidence": 84,
  "rootCause": "Compromised developer account (alex.chen@acmefin.dev)",
  "attackChain": [
    "Credential Theft",
    "Secret Access",
    "Malicious Dependency",
    "Data Exfiltration"
  ],
  "agentFindings": [
    {
      "agent": "Intake Agent",
      "status": "complete",
      "summary": "...",
      "riskContribution": 24,
      "keyFindings": [],
      "severity": "Medium"
    },
    {
      "agent": "Auth Agent",
      "status": "complete",
      "summary": "...",
      "riskContribution": 35,
      "keyFindings": [],
      "mitreMappings": [],
      "severity": "High"
    },
    {
      "agent": "Code Agent",
      "status": "complete",
      "summary": "...",
      "riskContribution": 58,
      "keyFindings": [],
      "mitreMappings": [],
      "severity": "High"
    },
    {
      "agent": "Network Agent",
      "status": "complete",
      "summary": "...",
      "riskContribution": 76,
      "keyFindings": [],
      "mitreMappings": [],
      "severity": "Critical"
    },
    {
      "agent": "Master Correlation Agent",
      "status": "complete",
      "summary": "...",
      "riskContribution": 84,
      "timeline": [],
      "severity": "Critical",
      "confidence": 84
    },
    {
      "agent": "Remediation Agent",
      "status": "complete",
      "summary": "...",
      "containment": [],
      "eradication": [],
      "recovery": [],
      "postIncident": [],
      "checklist": []
    }
  ],
  "mitreMappings": [
    { "id": "T1078", "name": "Valid Accounts", "reason": "..." },
    { "id": "T1552", "name": "Unsecured Credentials", "reason": "..." },
    { "id": "T1195", "name": "Supply Chain Compromise", "reason": "..." },
    { "id": "T1041", "name": "Exfiltration Over C2 Channel", "reason": "..." }
  ],
  "remediationChecklist": [],
  "finalReport": {
    "summary": "...",
    "timeline": [],
    "evidenceSummary": [],
    "recommendedActions": []
  }
}
```

## Agent Prompt Style

Each specialist agent receives:
- A role
- An objective
- Its slice of the mock incident data
- Expected JSON output schema
- Instruction to be realistic and analytical
- Instruction to mention uncertainty where evidence is incomplete

## Intake Agent Prompt

Role: You are a SOC Intake Agent.

Task: Analyze all raw security alerts. Decide whether they are related. Deduplicate noise, summarize the situation, assign an initial severity, and recommend whether deeper investigation is needed.

Return ONLY valid JSON:
```json
{
  "agent": "Intake Agent",
  "summary": "",
  "severity": "",
  "confidence": 0,
  "keyFindings": [],
  "riskContribution": 24
}
```

## Auth Agent Prompt

Role: You are an Authentication Security Agent.

Task: Analyze authentication logs and secret access logs. Look for unusual login location, unknown device, impossible travel, MFA anomalies, and suspicious access to secrets.

Return ONLY valid JSON:
```json
{
  "agent": "Auth Agent",
  "summary": "",
  "severity": "",
  "confidence": 0,
  "keyFindings": [],
  "mitreMappings": [],
  "riskContribution": 35
}
```

## Code Agent Prompt

Role: You are a Code Security Agent.

Task: Analyze repository events and package changes. Look for suspicious dependency additions, typosquatting, unusual commits, and activity shortly after suspicious login.

Return ONLY valid JSON:
```json
{
  "agent": "Code Agent",
  "summary": "",
  "severity": "",
  "confidence": 0,
  "keyFindings": [],
  "mitreMappings": [],
  "riskContribution": 58
}
```

## Network Agent Prompt

Role: You are a Network Security Agent.

Task: Analyze network logs. Look for large outbound transfers, unknown destination IPs, unapproved countries, and possible data exfiltration. Mention uncertainty if evidence is insufficient.

Return ONLY valid JSON:
```json
{
  "agent": "Network Agent",
  "summary": "",
  "severity": "",
  "confidence": 0,
  "keyFindings": [],
  "mitreMappings": [],
  "riskContribution": 76
}
```

## Master Correlation Agent Prompt

Role: You are the Master Correlation Agent.

Task: Analyze findings from all specialist agents. Correlate evidence into a single attack narrative. Identify root cause, final severity, confidence, and attack chain.

Return ONLY valid JSON:
```json
{
  "agent": "Master Correlation Agent",
  "summary": "",
  "rootCause": "",
  "severity": "",
  "confidence": 84,
  "riskScore": 84,
  "attackChain": [],
  "timeline": [],
  "mitreMappings": []
}
```

## Remediation Agent Prompt

Role: You are the Remediation Agent.

Task: Given the correlated incident report, generate concrete containment, eradication, recovery, and post-incident actions.

Return ONLY valid JSON:
```json
{
  "agent": "Remediation Agent",
  "summary": "",
  "containment": [],
  "eradication": [],
  "recovery": [],
  "postIncident": [],
  "checklist": []
}
```

## Fallback Requirement

If OpenAI API is unavailable or fails, return pre-written deterministic output from lib/fallbackInvestigation.ts.

The fallback must be complete — every field populated, risk score at 84%, all agents complete.

This is required for demo safety. The demo must not break if the API key is missing.
