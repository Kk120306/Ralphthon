"use client";

import { useMemo, useState } from "react";
import { Copy } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { InvestigationResponse } from "@/lib/types/investigation";

type ReportTab = "Executive Summary" | "Timeline" | "Evidence" | "MITRE" | "Remediation";
const TABS: ReportTab[] = ["Executive Summary", "Timeline", "Evidence", "MITRE", "Remediation"];

export function FinalReport({ result }: { result?: InvestigationResponse }) {
  const [tab, setTab] = useState<ReportTab>("Executive Summary");
  const [copied, setCopied] = useState(false);
  const brief = useMemo(() => result ? buildIncidentBrief(result) : "", [result]);

  async function copyBrief() {
    if (!brief) return;
    try {
      await navigator.clipboard?.writeText(brief);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="min-w-0 border-t border-line p-4 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3 font-mono text-xs uppercase tracking-[0.24em] text-slate-500 2xl:tracking-[0.32em]"><span>Final incident report</span><span className="flex shrink-0 items-center gap-2 text-mint"><span className="h-2 w-2 rounded-full bg-mint" />{result ? "ready" : "pending"}</span></div>
      <article className="overflow-hidden rounded-xl border border-line bg-white/[0.025]">
        <Row label="Incident type" value={result?.incidentName ?? "Awaiting generated report"} />
        <Row label="Severity" value={result?.severity ?? "—"} hot />
        <Row label="Confidence" value={result ? `${result.confidence}%` : "—"} />
        <Row label="Root cause" value={result?.rootCause ?? "Awaiting Master Correlation Agent"} />
        <Row label="Attack chain" value={result?.attackChain.join(" → ") ?? "—"} mono />
      </article>
      {result && (
        <div className="mt-4 rounded-xl border border-line bg-white/[0.025] p-4">
          <div className="mb-4 flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
            <div className="thin-scrollbar flex gap-2 overflow-x-auto pb-1">
              {TABS.map((item) => <button key={item} onClick={() => setTab(item)} className={cn("shrink-0 rounded-lg border px-3 py-2 text-xs font-medium transition", tab === item ? "border-ember/40 bg-ember/10 text-ember" : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]")}>{item}</button>)}
            </div>
            <button onClick={copyBrief} className="w-fit shrink-0 rounded-lg border border-mint/30 bg-mint/10 px-3 py-2 text-xs font-semibold text-mint hover:bg-mint/15"><Copy className="mr-2 inline h-3.5 w-3.5" />{copied ? "Copied" : "Copy incident brief"}</button>
          </div>
          <ReportTabContent tab={tab} result={result} />
        </div>
      )}
    </section>
  );
}

function ReportTabContent({ tab, result }: { tab: ReportTab; result: InvestigationResponse }) {
  if (tab === "Timeline") {
    return <div className="space-y-3">{result.finalReport.timeline.map((item, index) => <div key={`${item.time}-${index}`} className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-lg border border-line bg-black/20 p-3 text-sm"><span className="font-mono text-xs text-slate-500">{item.time}</span><span className="break-words text-slate-300"><span className="text-slate-500">{item.source ? `${item.source}: ` : ""}</span>{item.event}</span></div>)}</div>;
  }
  if (tab === "Evidence") {
    return <ul className="space-y-2 text-sm text-slate-400">{result.finalReport.evidenceSummary.map((e, index) => <li className="break-words" key={`${index}-${String(e).slice(0, 24)}`}>• {String(e)}</li>)}</ul>;
  }
  if (tab === "MITRE") {
    return <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">{result.mitreMappings.map((mapping) => <div key={mapping.id} className="rounded-lg border border-line bg-black/20 p-3"><div className="font-mono text-xs text-ember">{mapping.id}</div><div className="font-semibold text-slate-200">{mapping.name}</div><p className="mt-2 text-xs leading-5 text-slate-500">{mapping.reason}</p></div>)}</div>;
  }
  if (tab === "Remediation") {
    return <ol className="space-y-2 text-sm text-slate-400">{result.finalReport.recommendedActions.map((action, index) => <li className="break-words" key={`${index}-${action}`}><span className="font-mono text-mint">{String(index + 1).padStart(2, "0")}</span> {action}</li>)}</ol>;
  }
  return <div className="space-y-3 text-sm leading-6 text-slate-400"><p className="break-words text-slate-300">{result.finalReport.summary}</p><p><span className="font-semibold text-ember">Final:</span> {result.riskScore}% — {result.severity} Risk · {result.confidence}% confidence.</p><p><span className="font-semibold text-slate-200">Source:</span> {result.meta?.usedOpenAI ? "OpenAI-generated investigation output" : "Deterministic fallback investigation output"}</p></div>;
}

function buildIncidentBrief(result: InvestigationResponse): string {
  return `# ${result.incidentName}\n\n- Severity: ${result.severity}\n- Risk score: ${result.riskScore}%\n- Confidence: ${result.confidence}%\n- Root cause: ${result.rootCause}\n- Attack chain: ${result.attackChain.join(" → ")}\n\n## Summary\n${result.finalReport.summary}\n\n## Evidence\n${result.finalReport.evidenceSummary.map((item) => `- ${item}`).join("\n")}\n\n## Remediation\n${result.finalReport.recommendedActions.map((item) => `- ${item}`).join("\n")}`;
}

function Row({ label, value, hot, mono }: { label: string; value: string; hot?: boolean; mono?: boolean }) {
  return <div className="grid grid-cols-1 border-b border-line last:border-b-0 sm:grid-cols-[140px_minmax(0,1fr)] 2xl:grid-cols-[180px_minmax(0,1fr)]"><div className="px-4 pt-3 font-mono text-[11px] uppercase tracking-[0.22em] text-slate-500 sm:py-3 2xl:text-xs 2xl:tracking-[0.28em]">{label}</div><div className={`min-w-0 break-words px-4 pb-3 sm:py-3 ${hot ? "font-semibold text-ember" : "text-slate-200"} ${mono ? "font-mono text-sm" : ""}`}>{value}</div></div>;
}
