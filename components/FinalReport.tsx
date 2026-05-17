import type { InvestigationResponse } from "@/lib/types/investigation";

export function FinalReport({ result }: { result?: InvestigationResponse }) {
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
      {result && <div className="mt-4 rounded-xl border border-line bg-white/[0.025] p-4"><h3 className="mb-2 font-semibold">Evidence summary</h3><ul className="space-y-2 text-sm text-slate-400">{result.finalReport.evidenceSummary.map((e, index) => <li key={`${index}-${String(e).slice(0, 24)}`}>• {String(e)}</li>)}</ul></div>}
    </section>
  );
}

function Row({ label, value, hot, mono }: { label: string; value: string; hot?: boolean; mono?: boolean }) {
  return <div className="grid grid-cols-1 border-b border-line last:border-b-0 sm:grid-cols-[140px_minmax(0,1fr)] 2xl:grid-cols-[180px_minmax(0,1fr)]"><div className="px-4 pt-3 font-mono text-[11px] uppercase tracking-[0.22em] text-slate-500 sm:py-3 2xl:text-xs 2xl:tracking-[0.28em]">{label}</div><div className={`min-w-0 break-words px-4 pb-3 sm:py-3 ${hot ? "font-semibold text-ember" : "text-slate-200"} ${mono ? "font-mono text-sm" : ""}`}>{value}</div></div>;
}
