"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Shield, Sparkles, StepForward, X } from "lucide-react";
import { AgentCard, type AgentUiStatus } from "@/components/AgentCard";
import { AttackChain } from "@/components/AttackChain";
import { CorrelationGraph } from "@/components/CorrelationGraph";
import { FinalReport } from "@/components/FinalReport";
import { MitreCards } from "@/components/MitreCards";
import { MockPrResult } from "@/components/MockPrResult";
import { ReasoningFeed, type ReasoningMessage } from "@/components/ReasoningFeed";
import { RemediationChecklist } from "@/components/RemediationChecklist";
import { RiskScorePanel } from "@/components/RiskScorePanel";
import { cn } from "@/lib/utils/cn";
import type { AgentFinding, AgentName, InvestigationResponse, RawTimelineEvent, SimulationPhase } from "@/lib/types/investigation";

const AGENTS: AgentName[] = ["Intake Agent", "Auth Agent", "Code Agent", "Network Agent", "Master Correlation Agent", "Remediation Agent"];
const REVEAL_MS = 700;

export default function IncidentDashboard() {
  const [phase, setPhase] = useState<SimulationPhase>("idle");
  const [result, setResult] = useState<InvestigationResponse>();
  const [revealed, setRevealed] = useState<AgentFinding[]>([]);
  const [allRawEvents, setAllRawEvents] = useState<RawTimelineEvent[]>([]);
  const [rawCursor, setRawCursor] = useState(0);
  const [timelinePaused, setTimelinePaused] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<RawTimelineEvent>();
  const [risk, setRisk] = useState(0);
  const [messages, setMessages] = useState<ReasoningMessage[]>([]);
  const [error, setError] = useState<string>();
  const [resetEpoch, setResetEpoch] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const activeRun = useRef(0);
  const abortController = useRef<AbortController | null>(null);

  const rawEvents = useMemo(() => allRawEvents.slice(0, rawCursor), [allRawEvents, rawCursor]);
  const completedAgents = useMemo(() => revealed.map((finding) => finding.agent), [revealed]);

  const statuses = useMemo(() => Object.fromEntries(AGENTS.map((agent, index) => {
    let status: AgentUiStatus = phase === "idle" ? "idle" : "queued";
    if (revealed.some((f) => f.agent === agent)) status = "complete";
    else if (["running-agents", "correlating", "remediation", "streaming-events"].includes(phase) && revealed.length === index) status = "investigating";
    if (phase === "error" && revealed.length === index) status = "error";
    return [agent, status];
  })) as Record<AgentName, AgentUiStatus>, [phase, revealed]);

  useEffect(() => {
    if (timelinePaused || rawCursor >= allRawEvents.length) return;
    if (!["streaming-events", "running-agents", "correlating", "remediation"].includes(phase)) return;
    const timer = window.setTimeout(() => setRawCursor((cursor) => {
      const next = Math.min(cursor + 1, allRawEvents.length);
      if (next >= allRawEvents.length && phase === "streaming-events") {
        window.setTimeout(() => setPhase("running-agents"), 0);
      }
      return next;
    }), REVEAL_MS);
    return () => window.clearTimeout(timer);
  }, [allRawEvents.length, phase, rawCursor, timelinePaused]);

  function reset() {
    activeRun.current += 1;
    abortController.current?.abort();
    abortController.current = null;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setResetEpoch((epoch) => epoch + 1);
    setPhase("idle");
    setResult(undefined);
    setRevealed([]);
    setAllRawEvents([]);
    setRawCursor(0);
    setTimelinePaused(false);
    setSelectedEvent(undefined);
    setRisk(0);
    setMessages([]);
    setError(undefined);
  }

  function stepTimeline() {
    setRawCursor((cursor) => {
      const next = Math.min(cursor + 1, allRawEvents.length);
      if (next >= allRawEvents.length && phase === "streaming-events") {
        window.setTimeout(() => setPhase("running-agents"), 0);
      }
      return next;
    });
  }

  async function runScenario() {
    reset();
    const runId = activeRun.current + 1;
    activeRun.current = runId;
    const controller = new AbortController();
    abortController.current = controller;
    setPhase("streaming-events");
    setRisk(12);
    setMessages([{ agent: "Intake Agent", t: "+0.0s", message: "Incident INC-2026-0517-ACME-001 received. Loading raw logs from auth, secrets, code, CI/CD, and network sources." }]);
    void loadRawTimeline(controller.signal, (events) => {
      if (activeRun.current !== runId) return;
      setAllRawEvents(events);
      setRawCursor(0);
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
          if (finding.agent === "Master Correlation Agent") setPhase("correlating");
          else if (finding.agent === "Remediation Agent") setPhase("remediation");
          else setPhase("running-agents");
          setRevealed((current) => [...current, finding]);
          setRisk((current) => finding.riskScore ?? finding.riskContribution ?? (index === data.agentFindings.length - 1 ? data.riskScore : current));
          setMessages((current) => [
            ...current,
            { agent: finding.agent, t: `+${(3.5 + index * 1.2).toFixed(1)}s`, message: finding.summary },
            ...(finding.keyFindings ?? []).slice(0, 2).map((message, sub) => ({ agent: finding.agent, t: `+${(3.7 + index * 1.2 + sub * 0.2).toFixed(1)}s`, message: String(message) })),
          ]);
          if (index === data.agentFindings.length - 1) {
            abortController.current = null;
            setRisk(data.riskScore);
            setPhase("complete");
          }
        }, 3500 + index * 1200));
      });
    } catch (err) {
      if (activeRun.current !== runId) return;
      if (err instanceof DOMException && err.name === "AbortError") return;
      abortController.current = null;
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setPhase("error");
      setError(err instanceof Error ? err.message : "Unknown investigation error");
    }
  }

  const visibleResult = phase === "complete" ? result : undefined;
  const activeChainCount = Math.min(Math.max(revealed.length - 1, 0), 4);

  return (
    <main className="min-h-screen max-w-full overflow-x-hidden bg-shell/85 text-slate-100">
      <Header phase={phase} runScenario={runScenario} reset={reset} />
      {error && <div className="border-b border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember sm:px-6">Investigation failed: {error}</div>}
      <div className="grid min-h-[calc(100vh-88px)] grid-cols-1 xl:grid-cols-[minmax(280px,320px)_minmax(0,1fr)_minmax(320px,380px)] 2xl:grid-cols-[390px_minmax(0,1fr)_530px]">
        <aside className="min-w-0 border-r border-line bg-black/20 p-4 sm:p-5">
          <IncidentRail phase={phase} />
          <div className="mt-8 border-t border-line pt-6">
            <div className="mb-4 flex items-center justify-between font-mono text-xs uppercase tracking-[0.32em] text-slate-500"><span>Swarm · 6 agents</span><span>{revealed.length}/6 done</span></div>
            <div className="space-y-3">{AGENTS.map((agent) => <AgentCard key={`${resetEpoch}-${agent}`} name={agent} status={statuses[agent]} finding={revealed.find((f) => f.agent === agent)} />)}</div>
          </div>
        </aside>
        <section className="min-w-0 bg-shell/40">
          <RawTimeline events={rawEvents} total={allRawEvents.length} phase={phase} paused={timelinePaused} onPause={() => setTimelinePaused(true)} onResume={() => setTimelinePaused(false)} onStep={stepTimeline} onSelect={setSelectedEvent} completedAgents={completedAgents} />
          <ReasoningFeed messages={messages} />
          <CorrelationGraph events={rawEvents} completedAgents={completedAgents} />
          <AttackChain chain={result?.attackChain} activeCount={activeChainCount} />
          <MitreCards mappings={result?.mitreMappings} />
        </section>
        <aside className="min-w-0 border-l border-line bg-black/25">
          <RiskScorePanel score={risk} result={result} />
          <FinalReport key={`report-${resetEpoch}-${visibleResult ? "ready" : "idle"}`} result={visibleResult} />
          <RemediationChecklist key={`remediation-${resetEpoch}-${visibleResult ? "ready" : "idle"}`} items={visibleResult?.remediationChecklist ?? []} />
          <MockPrResult key={`pr-${resetEpoch}-${visibleResult ? "ready" : "idle"}`} pr={visibleResult?.mockPrResult} />
        </aside>
      </div>
      {selectedEvent && <EvidenceDrawer event={selectedEvent} onClose={() => setSelectedEvent(undefined)} completedAgents={completedAgents} />}
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

function Header({ phase, runScenario, reset }: { phase: SimulationPhase; runScenario: () => void; reset: () => void }) {
  return <header className="flex flex-col gap-4 border-b border-line bg-shell/95 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between"><div className="flex min-w-0 items-center gap-3 sm:gap-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-ember/25 bg-ember/10 shadow-glow"><Shield className="h-5 w-5 text-ember" /></div><div className="min-w-0"><h1 className="truncate text-xl font-semibold">IncidentIQ</h1><p className="truncate text-sm text-slate-500">Autonomous AI SOC for Startups</p></div><div className="ml-4 hidden min-w-0 flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500 md:flex"><span>workspace · acme-prod</span><span>region · ap-southeast-1</span><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-mint" />swarm online</span></div></div><div className="grid grid-cols-[auto_auto] gap-3 sm:flex sm:items-center"><span className="rounded-lg border border-line bg-white/[0.03] px-3 py-2 text-center font-mono text-xs text-mint sm:px-4">✓ {phase}</span><button onClick={reset} className="rounded-lg border border-line bg-white/[0.04] px-3 py-2 text-slate-300 hover:bg-white/[0.08] sm:px-4 sm:py-3"><RotateCcw className="inline h-4 w-4" /> Reset</button><button onClick={runScenario} disabled={phase !== "idle" && phase !== "complete" && phase !== "error"} className="col-span-2 rounded-lg bg-ember px-4 py-3 font-semibold text-white shadow-glow transition hover:bg-red-500 disabled:cursor-wait disabled:opacity-60 sm:col-span-1 sm:px-5"><Sparkles className="mr-2 inline h-4 w-4" />Run Scenario</button></div></header>;
}

function IncidentRail({ phase }: { phase: SimulationPhase }) {
  const showCurrentIncident = phase !== "idle";
  const incidentCorrelated = ["correlating", "remediation", "complete"].includes(phase);
  const currentIncident = incidentCorrelated ? ["Supply-chain attack", "SS-2419 · correlated", "bg-ember"] as const : ["Unclassified security signals", "SS-2419 · triage", "bg-amber"] as const;
  const backgroundIncidents = [["Brute force on staging SSH", "SS-2418 · 12m", "bg-orange-500"], ["Anomalous S3 read pattern", "SS-2417 · 1h 4m", "bg-yellow-400"], ["Expired TLS cert (api-edge)", "SS-2416 · 3h", "bg-mint"]] as const;
  const incidents = showCurrentIncident ? [currentIncident, ...backgroundIncidents] : backgroundIncidents;

  return <section className="min-w-0"><div className="mb-4 font-mono text-xs uppercase tracking-[0.35em] text-slate-500">Incidents</div><div className="space-y-2">{!showCurrentIncident && <div data-testid="incident-placeholder" className="min-w-0 rounded-lg border border-dashed border-line bg-white/[0.015] p-4 text-sm text-slate-500"><div className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-600">No active incident</div><div className="mt-1 text-slate-500">Waiting for incident to start...</div></div>}{incidents.map(([name, meta, dot], i) => {
    const isCurrent = showCurrentIncident && i === 0;
    return <div key={name} data-testid={isCurrent ? "current-incident" : undefined} className={cn("min-w-0 rounded-lg border p-4", isCurrent ? "border-white/10 bg-white/[0.06] shadow-[inset_3px_0_0_#ff454b]" : "border-transparent opacity-80")}><div className="flex min-w-0 items-center gap-3"><span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", dot)} /><div className="min-w-0"><div className="truncate">{name}</div><div className="truncate font-mono text-xs text-slate-500">{meta}</div></div></div></div>;
  })}</div></section>;
}

function RawTimeline({ events, total, phase, paused, onPause, onResume, onStep, onSelect, completedAgents }: { events: RawTimelineEvent[]; total: number; phase: SimulationPhase; paused: boolean; onPause: () => void; onResume: () => void; onStep: () => void; onSelect: (event: RawTimelineEvent) => void; completedAgents: AgentName[] }) {
  const criticalCount = events.filter((event) => event.severity === "CRITICAL").length;
  const highCount = events.filter((event) => event.severity === "HIGH").length;
  const countLabel = total > 0 ? `${events.length}/${total} signals` : `${events.length} signals`;
  const canControl = total > 0 && events.length < total && phase !== "idle" && phase !== "error";
  const completed = new Set(completedAgents);

  return <section className="min-w-0 border-b border-line p-4 sm:p-6"><div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h2 className="text-lg font-semibold">Raw event timeline <span className="block text-sm font-normal text-slate-500 sm:ml-2 sm:inline">acme-prod · investigation window</span></h2><span className="font-mono text-xs text-slate-500">{countLabel} · <span className="text-ember">{criticalCount} critical</span> · <span className="text-amber">{highCount} high</span></span></div><div className="flex flex-wrap gap-2"><button onClick={paused ? onResume : onPause} disabled={!canControl} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300 disabled:cursor-not-allowed disabled:opacity-40">{paused ? <Play className="mr-1 inline h-3.5 w-3.5" /> : <Pause className="mr-1 inline h-3.5 w-3.5" />}{paused ? "Resume" : "Pause"}</button><button onClick={onStep} disabled={events.length >= total || total === 0} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"><StepForward className="mr-1 inline h-3.5 w-3.5" />Step</button></div></div><div className="space-y-2">{events.length === 0 ? <div className="rounded-lg border border-dashed border-line bg-white/[0.015] px-4 py-6 text-sm text-slate-500">{phase !== "idle" ? "Waiting for telemetry stream…" : "Run the scenario to stream raw telemetry events."}</div> : events.map((event) => {
    const correlated = Boolean(event.linkedAgent && completed.has(event.linkedAgent));
    return <button data-testid="raw-event" key={event.id ?? event.time} onClick={() => onSelect(event)} className={cn("grid w-full min-w-0 animate-fadeUp grid-cols-[auto_1fr_auto] items-start gap-2 rounded-lg border border-line bg-white/[0.025] px-3 py-3 text-left transition hover:border-cobalt/40 hover:bg-cobalt/5 sm:grid-cols-[96px_90px_minmax(0,1fr)_88px] sm:items-center sm:gap-3 sm:px-4", event.severity === "CRITICAL" && "border-ember/30 shadow-[inset_3px_0_0_#ff454b]")}><span className="font-mono text-xs text-slate-500 sm:text-sm">{event.time}</span><span className="rounded border border-white/10 px-2 py-1 text-center font-mono text-[11px] text-slate-400 sm:text-xs">{event.source}</span><span className="col-span-3 min-w-0 break-words text-sm text-slate-200 sm:col-span-1 sm:text-base">{event.text}{correlated && <span className="ml-2 inline-flex rounded border border-mint/30 bg-mint/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-mint">Correlated by {event.linkedAgent}</span>}</span><span className={cn("col-start-3 row-start-1 rounded-md border px-2 py-1 text-center font-mono text-[11px] sm:col-start-auto sm:row-start-auto sm:text-xs", event.severity === "CRITICAL" ? "border-ember/30 bg-ember/10 text-ember" : "border-orange-500/30 bg-orange-500/10 text-orange-400")}>{event.severity}</span></button>;
  })}</div></section>;
}

function EvidenceDrawer({ event, onClose, completedAgents }: { event: RawTimelineEvent; onClose: () => void; completedAgents: AgentName[] }) {
  const correlated = Boolean(event.linkedAgent && completedAgents.includes(event.linkedAgent));
  return <div data-testid="evidence-drawer" className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true"><button className="hidden flex-1 cursor-default sm:block" onClick={onClose} aria-label="Close evidence drawer backdrop" /><aside className="thin-scrollbar h-full w-full max-w-xl overflow-y-auto border-l border-line bg-panel p-4 shadow-2xl sm:p-6"><div className="mb-5 flex items-start justify-between gap-4"><div><div className="font-mono text-xs uppercase tracking-[0.3em] text-slate-500">Evidence drawer</div><h2 className="mt-2 break-words text-xl font-semibold text-slate-100">{event.text}</h2></div><button onClick={onClose} className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-slate-300 hover:bg-white/[0.08]" aria-label="Close evidence drawer"><X className="h-4 w-4" /></button></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Info label="Source" value={event.source} /><Info label="Timestamp" value={event.time} /><Info label="Severity" value={event.severity} hot={event.severity === "CRITICAL"} /><Info label="Linked agent" value={event.linkedAgent ?? "—"} /></div><div className="mt-4 flex flex-wrap gap-2">{event.correlationTags?.map((tag) => <span key={tag} className="rounded border border-cobalt/30 bg-cobalt/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-cobalt">{tag}</span>)}{correlated && <span className="rounded border border-mint/30 bg-mint/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-mint">Correlated by {event.linkedAgent}</span>}</div><div className="mt-5"><div className="mb-2 font-mono text-xs uppercase tracking-[0.24em] text-slate-500">Relevant JSON excerpt</div><pre className="thin-scrollbar max-h-[60vh] overflow-auto rounded-xl border border-line bg-black/45 p-4 text-xs leading-5 text-slate-300">{JSON.stringify(event.raw ?? event, null, 2)}</pre></div></aside></div>;
}

function Info({ label, value, hot }: { label: string; value: string; hot?: boolean }) {
  return <div className="rounded-lg border border-line bg-white/[0.025] p-3"><div className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">{label}</div><div className={cn("mt-1 break-words text-sm", hot ? "font-semibold text-ember" : "text-slate-200")}>{value}</div></div>;
}
