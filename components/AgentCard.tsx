"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, CircleDashed, Loader2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { AgentFinding, AgentName } from "@/lib/types/investigation";

export type AgentUiStatus = "idle" | "queued" | "investigating" | "complete" | "error";

const ROLE: Record<AgentName, string> = {
  "Intake Agent": "First responder triage",
  "Auth Agent": "Identity & secrets",
  "Code Agent": "Source & dependencies",
  "Network Agent": "Egress & traffic",
  "Master Correlation Agent": "Correlation command",
  "Remediation Agent": "Containment planning",
};

const ACCENT: Record<AgentName, string> = {
  "Intake Agent": "text-amber border-amber/30 bg-amber/10",
  "Auth Agent": "text-cobalt border-cobalt/30 bg-cobalt/10",
  "Code Agent": "text-violet border-violet/30 bg-violet/10",
  "Network Agent": "text-cobalt border-cobalt/30 bg-cobalt/10",
  "Master Correlation Agent": "text-amber border-amber/30 bg-amber/10",
  "Remediation Agent": "text-mint border-mint/30 bg-mint/10",
};

const STATUS_COPY: Record<AgentName, string> = {
  "Intake Agent": "Grouping weak signals across raw sources",
  "Auth Agent": "Parsing Okta and Vault logs",
  "Code Agent": "Comparing package manifests",
  "Network Agent": "Correlating outbound traffic",
  "Master Correlation Agent": "Stitching cross-domain evidence",
  "Remediation Agent": "Drafting containment and PR plan",
};

export function AgentCard({
  name,
  status,
  finding,
}: {
  name: AgentName;
  status: AgentUiStatus;
  finding?: AgentFinding;
}) {
  const [expanded, setExpanded] = useState(false);
  const progress = status === "complete" ? 100 : status === "investigating" ? 55 : status === "queued" ? 12 : 0;
  const canExpand = Boolean(finding);

  return (
    <article
      data-testid={`agent-card-${name.toLowerCase().replaceAll(" ", "-")}`}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-panel2/80 p-4 shadow-black/20 transition duration-300",
        status === "complete" ? "border-white/12" : status === "investigating" ? "border-ember/40 shadow-glow" : "border-line/80",
      )}
    >
      {status === "investigating" && <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ember to-transparent animate-sweep" />}
      <button
        type="button"
        onClick={() => canExpand && setExpanded((value) => !value)}
        className="flex w-full items-start gap-3 text-left disabled:cursor-default"
        disabled={!canExpand}
        aria-expanded={canExpand ? expanded : undefined}
      >
        <div className={cn("rounded-lg border p-2", ACCENT[name])}>
          {status === "complete" ? <CheckCircle2 className="h-5 w-5" /> : status === "investigating" ? <Loader2 className="h-5 w-5 animate-spin" /> : status === "error" ? <ShieldAlert className="h-5 w-5 text-ember" /> : <CircleDashed className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-slate-100">{name}</h3>
            <span className={cn("rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em]", status === "complete" ? "border-mint/30 bg-mint/10 text-mint" : status === "investigating" ? "border-ember/35 bg-ember/10 text-ember" : status === "queued" ? "border-cobalt/25 bg-cobalt/10 text-cobalt" : "border-white/10 bg-white/[0.03] text-slate-500")}>{status}</span>
          </div>
          <p className="mt-1 text-xs font-mono text-slate-500">{ROLE[name]}</p>
        </div>
        {canExpand && <ChevronDown className={cn("mt-1 h-4 w-4 shrink-0 text-slate-500 transition", expanded && "rotate-180 text-slate-200")} />}
      </button>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div className={cn("h-full rounded-full transition-all duration-700", name.includes("Code") ? "bg-violet" : name.includes("Remediation") ? "bg-mint" : name.includes("Master") ? "bg-amber" : "bg-cobalt")} style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-3 min-h-[58px] text-xs leading-5 text-slate-400">
        {finding ? (
          <>
            <div className="mb-1 flex items-center justify-between gap-3 font-mono text-[11px] text-slate-500">
              <span>{finding.severity ?? "Analysis"}</span>
              <span>{finding.confidence ? `${finding.confidence}% confidence` : "complete"}</span>
            </div>
            <p className={cn(expanded ? "" : "line-clamp-3")}>{finding.summary}</p>
          </>
        ) : status === "investigating" ? (
          <p className="text-slate-300">{STATUS_COPY[name]}…</p>
        ) : status === "queued" ? (
          <p className="text-slate-600">Queued behind upstream evidence.</p>
        ) : (
          <p className="text-slate-600">Awaiting scenario execution.</p>
        )}
      </div>
      {finding && expanded && (
        <div className="mt-4 space-y-4 border-t border-line pt-4 animate-fadeUp">
          <MiniList title="Key findings" items={finding.keyFindings} />
          <MiniList title="Evidence IDs" items={finding.evidenceIds} mono />
          {finding.mitreMappings?.length ? (
            <div>
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">MITRE mappings</div>
              <div className="flex flex-wrap gap-2">
                {finding.mitreMappings.map((mapping) => <span key={`${name}-${mapping.id}`} className="rounded border border-ember/30 bg-ember/10 px-2 py-1 font-mono text-[10px] text-ember">{mapping.id}</span>)}
              </div>
            </div>
          ) : null}
          {finding.attackChain?.length ? <MiniList title="Attack chain" items={finding.attackChain} /> : null}
          {finding.checklist?.length ? <MiniList title="Checklist" items={finding.checklist.slice(0, 4)} /> : null}
        </div>
      )}
    </article>
  );
}

function MiniList({ title, items, mono }: { title: string; items?: string[]; mono?: boolean }) {
  if (!items?.length) return null;
  return <div><div className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">{title}</div><ul className={cn("space-y-1 text-xs leading-5 text-slate-400", mono && "font-mono")}>{items.map((item) => <li className="break-words" key={`${title}-${item}`}>• {item}</li>)}</ul></div>;
}
