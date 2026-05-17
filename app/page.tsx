"use client";

import { useMemo, useRef, useState } from "react";
import { RotateCcw, Shield, Sparkles } from "lucide-react";
import { AgentCard, type AgentUiStatus } from "@/components/AgentCard";
import { AttackChain } from "@/components/AttackChain";
import { FinalReport } from "@/components/FinalReport";
import { MitreCards } from "@/components/MitreCards";
import { MockPrResult } from "@/components/MockPrResult";
import { ReasoningFeed, type ReasoningMessage } from "@/components/ReasoningFeed";
import { RemediationChecklist } from "@/components/RemediationChecklist";
import { RiskScorePanel } from "@/components/RiskScorePanel";
import { cn } from "@/lib/utils/cn";
import type { AgentFinding, AgentName, InvestigationResponse, RawTimelineEvent } from "@/lib/types/investigation";

const AGENTS: AgentName[] = ["Intake Agent", "Auth Agent", "Code Agent", "Network Agent", "Master Correlation Agent", "Remediation Agent"];

export default function IncidentDashboard() {
  const [mode, setMode] = useState<"idle" | "investigating" | "complete" | "error">("idle");
  const [result, setResult] = useState<InvestigationResponse>();
  const [revealed, setRevealed] = useState<AgentFinding[]>([]);
  const [rawEvents, setRawEvents] = useState<RawTimelineEvent[]>([]);
  const [rawTotal, setRawTotal] = useState(0);
  const [risk, setRisk] = useState(0);
  const [messages, setMessages] = useState<ReasoningMessage[]>([]);
  const [error, setError] = useState<string>();
  const [resetEpoch, setResetEpoch] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const activeRun = useRef(0);
  const abortController = useRef<AbortController | null>(null);

  const statuses = useMemo(() => Object.fromEntries(AGENTS.map((agent, index) => {
    let status: AgentUiStatus = "idle";
    if (revealed.some((f) => f.agent === agent)) status = "complete";
    else if (mode === "investigating" && revealed.length === index) status = "investigating";
    if (mode === "error" && revealed.length === index) status = "error";
    return [agent, status];
  })) as Record<AgentName, AgentUiStatus>, [mode, revealed]);

  function reset() {
    activeRun.current += 1;
    abortController.current?.abort();
    abortController.current = null;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setResetEpoch((epoch) => epoch + 1);
    setMode("idle");
    setResult(undefined);
    setRevealed([]);
    setRawEvents([]);
    setRawTotal(0);
    setRisk(0);
    setMessages([]);
    setError(undefined);
  }

  async function runScenario() {
    reset();
    const runId = activeRun.current + 1;
    activeRun.current = runId;
    const controller = new AbortController();
    abortController.current = controller;
    setMode("investigating");
    setRisk(0);
    setMessages([{ agent: "Intake Agent", t: "+0.0s", message: "Incident INC-2026-0517-ACME-001 received. Loading raw logs from auth, secrets, code, CI/CD, and network sources." }]);
    void loadRawTimeline(controller.signal, (events) => {
      if (activeRun.current !== runId) return;
      setRawTotal(events.length);
      events.forEach((event, index) => {
        timers.current.push(setTimeout(() => {
          if (activeRun.current !== runId) return;
          setRawEvents((current) => [...current, event]);
        }, 500 + index * 700));
      });
    });
    try {
      const response = await fetch("/api/investigate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scenarioId: "supply-chain-attack" }), signal: controller.signal });
      if (activeRun.current !== runId) return;
      if (!response.ok) throw new Error(`API returned ${response.status}`);
      const data = (await response.json()) as InvestigationResponse;
      if (activeRun.current !== runId) return;
      setResult(data);
      data.agentFindings.forEach((finding, index) => {
        timers.current.push(setTimeout(() => {
          if (activeRun.current !== runId) return;
          setRevealed((current) => [...current, finding]);
          setRisk((current) => finding.riskScore ?? finding.riskContribution ?? (index === data.agentFindings.length - 1 ? data.riskScore : current));
          setMessages((current) => [
            ...current,
            { agent: finding.agent, t: `+${((index + 1) * 1.5).toFixed(1)}s`, message: finding.summary },
            ...(finding.keyFindings ?? []).slice(0, 2).map((message, sub) => ({ agent: finding.agent, t: `+${((index + 1) * 1.5 + (sub + 1) * 0.2).toFixed(1)}s`, message: String(message) })),
          ]);
          if (index === data.agentFindings.length - 1) {
            abortController.current = null;
            setMode("complete");
          }
        }, (index + 1) * 1500));
      });
    } catch (err) {
      if (activeRun.current !== runId) return;
      if (err instanceof DOMException && err.name === "AbortError") return;
      abortController.current = null;
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setMode("error");
      setError(err instanceof Error ? err.message : "Unknown investigation error");
    }
  }

  const visibleResult = mode === "complete" ? result : undefined;
  const activeChainCount = Math.min(Math.max(revealed.length - 1, 0), 4);

  return (
    <main className="min-h-screen max-w-full overflow-x-hidden bg-shell/85 text-slate-100">
      <Header mode={mode} runScenario={runScenario} reset={reset} />
      {error && <div className="border-b border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember sm:px-6">Investigation failed: {error}</div>}
      <div className="grid min-h-[calc(100vh-88px)] grid-cols-1 xl:grid-cols-[minmax(280px,320px)_minmax(0,1fr)_minmax(320px,380px)] 2xl:grid-cols-[390px_minmax(0,1fr)_530px]">
        <aside className="min-w-0 border-r border-line bg-black/20 p-4 sm:p-5">
          <IncidentRail />
          <div className="mt-8 border-t border-line pt-6">
            <div className="mb-4 flex items-center justify-between font-mono text-xs uppercase tracking-[0.32em] text-slate-500"><span>Swarm · 6 agents</span><span>{revealed.length}/6 done</span></div>
            <div className="space-y-3">{AGENTS.map((agent) => <AgentCard key={agent} name={agent} status={statuses[agent]} finding={revealed.find((f) => f.agent === agent)} />)}</div>
          </div>
        </aside>
        <section className="min-w-0 bg-shell/40">
          <RawTimeline events={rawEvents} total={rawTotal} mode={mode} />
          <ReasoningFeed messages={messages} />
          <AttackChain chain={result?.attackChain} activeCount={activeChainCount} />
          <MitreCards mappings={result?.mitreMappings} />
        </section>
        <aside className="min-w-0 border-l border-line bg-black/25">
          <RiskScorePanel score={risk} result={result} />
          <FinalReport result={visibleResult} />
          <RemediationChecklist key={`remediation-${resetEpoch}-${visibleResult ? "ready" : "idle"}`} items={visibleResult?.remediationChecklist ?? []} />
          <MockPrResult pr={visibleResult?.mockPrResult} />
        </aside>
      </div>
    </main>
  );
}

async function loadRawTimeline(
  signal: AbortSignal,
  onLoaded: (events: RawTimelineEvent[]) => void,
) {
  try {
    const response = await fetch("/api/investigate?scenarioId=supply-chain-attack", { signal });
    if (!response.ok) return;
    const data = (await response.json()) as { rawTimeline?: RawTimelineEvent[] };
    if (!data.rawTimeline?.length) return;
    onLoaded(data.rawTimeline);
  } catch (err) {
    if (!(err instanceof DOMException && err.name === "AbortError")) {
      console.warn("Raw timeline load failed", err);
    }
  }
}

function Header({ mode, runScenario, reset }: { mode: string; runScenario: () => void; reset: () => void }) {
  return <header className="flex flex-col gap-4 border-b border-line bg-shell/95 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between"><div className="flex min-w-0 items-center gap-3 sm:gap-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-ember/25 bg-ember/10 shadow-glow"><Shield className="h-5 w-5 text-ember" /></div><div className="min-w-0"><h1 className="truncate text-xl font-semibold">IncidentIQ</h1><p className="truncate text-sm text-slate-500">Autonomous AI SOC for Startups</p></div><div className="ml-4 hidden min-w-0 flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500 md:flex"><span>workspace · acme-prod</span><span>region · ap-southeast-1</span><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-mint" />swarm online</span></div></div><div className="grid grid-cols-[auto_auto] gap-3 sm:flex sm:items-center"><span className="rounded-lg border border-line bg-white/[0.03] px-3 py-2 text-center font-mono text-xs text-mint sm:px-4">✓ {mode}</span><button onClick={reset} className="rounded-lg border border-line bg-white/[0.04] px-3 py-2 text-slate-300 hover:bg-white/[0.08] sm:px-4 sm:py-3"><RotateCcw className="inline h-4 w-4" /> Reset</button><button onClick={runScenario} disabled={mode === "investigating"} className="col-span-2 rounded-lg bg-ember px-4 py-3 font-semibold text-white shadow-glow transition hover:bg-red-500 disabled:cursor-wait disabled:opacity-60 sm:col-span-1 sm:px-5"><Sparkles className="mr-2 inline h-4 w-4" />Run Supply-Chain Attack Scenario</button></div></header>;
}

function IncidentRail() {
  const incidents = [["Supply-chain attack", "SS-2419 · now", "bg-ember"], ["Brute force on staging SSH", "SS-2418 · 12m", "bg-orange-500"], ["Anomalous S3 read pattern", "SS-2417 · 1h 4m", "bg-yellow-400"], ["Expired TLS cert (api-edge)", "SS-2416 · 3h", "bg-mint"]];
  return <section className="min-w-0"><div className="mb-4 font-mono text-xs uppercase tracking-[0.35em] text-slate-500">Incidents</div><div className="space-y-2">{incidents.map(([name, meta, dot], i) => <div key={name} className={cn("min-w-0 rounded-lg border p-4", i === 0 ? "border-white/10 bg-white/[0.06] shadow-[inset_3px_0_0_#ff454b]" : "border-transparent opacity-80")}><div className="flex min-w-0 items-center gap-3"><span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", dot)} /><div className="min-w-0"><div className="truncate">{name}</div><div className="truncate font-mono text-xs text-slate-500">{meta}</div></div></div></div>)}</div></section>;
}

function RawTimeline({ events, total, mode }: { events: RawTimelineEvent[]; total: number; mode: string }) {
  const criticalCount = events.filter((event) => event.severity === "CRITICAL").length;
  const highCount = events.filter((event) => event.severity === "HIGH").length;
  const countLabel = total > 0 ? `${events.length}/${total} signals` : `${events.length} signals`;

  return <section className="min-w-0 border-b border-line p-4 sm:p-6"><div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"><h2 className="text-lg font-semibold">Raw event timeline <span className="block text-sm font-normal text-slate-500 sm:ml-2 sm:inline">acme-prod · investigation window</span></h2><span className="font-mono text-xs text-slate-500">{countLabel} · <span className="text-ember">{criticalCount} critical</span> · <span className="text-amber">{highCount} high</span></span></div><div className="space-y-2">{events.length === 0 ? <div className="rounded-lg border border-dashed border-line bg-white/[0.015] px-4 py-6 text-sm text-slate-500">{mode === "investigating" ? "Waiting for telemetry stream…" : "Run the scenario to stream raw telemetry events."}</div> : events.map(({ time, source, text, severity }) => <div key={time} className={cn("grid min-w-0 animate-fadeUp grid-cols-[auto_1fr_auto] items-start gap-2 rounded-lg border border-line bg-white/[0.025] px-3 py-3 sm:grid-cols-[96px_90px_minmax(0,1fr)_88px] sm:items-center sm:gap-3 sm:px-4", severity === "CRITICAL" && "border-ember/30 shadow-[inset_3px_0_0_#ff454b]")}><span className="font-mono text-xs text-slate-500 sm:text-sm">{time}</span><span className="rounded border border-white/10 px-2 py-1 text-center font-mono text-[11px] text-slate-400 sm:text-xs">{source}</span><span className="col-span-3 min-w-0 break-words text-sm text-slate-200 sm:col-span-1 sm:text-base">{text}</span><span className={cn("col-start-3 row-start-1 rounded-md border px-2 py-1 text-center font-mono text-[11px] sm:col-start-auto sm:row-start-auto sm:text-xs", severity === "CRITICAL" ? "border-ember/30 bg-ember/10 text-ember" : "border-orange-500/30 bg-orange-500/10 text-orange-400")}>{severity}</span></div>)}</div></section>;
}
