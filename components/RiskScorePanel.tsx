import { cn } from "@/lib/utils/cn";
import type { InvestigationResponse } from "@/lib/types/investigation";

export function RiskScorePanel({ score, result, label = "Critical Risk" }: { score: number; result?: InvestigationResponse; label?: string }) {
  const deg = Math.min(360, Math.max(0, score * 3.6));
  const resultSource = result ? (result.meta?.usedOpenAI ? "OpenAI" : "Fallback") : "—";

  return (
    <section className="rounded-none border-b border-line bg-shell/40 p-4 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3 font-mono text-xs uppercase tracking-[0.25em] text-slate-500 sm:tracking-[0.35em]">
        <span>Risk score</span>
        <span>SS-2419</span>
      </div>
      <div className="grid grid-cols-1 items-center justify-items-center gap-5 sm:grid-cols-[140px_1fr] 2xl:grid-cols-[170px_1fr]">
        <div className="relative grid h-32 w-32 place-items-center rounded-full animate-pulseRing 2xl:h-40 2xl:w-40" style={{ background: `conic-gradient(#ff454b ${deg}deg, rgba(255,255,255,.08) 0deg)` }}>
          <div className="absolute inset-3 rounded-full bg-shell shadow-[inset_0_0_40px_rgba(255,69,75,.22)]" />
          <div className="relative text-center">
            <div className={cn("font-mono text-4xl font-black 2xl:text-5xl", score >= 80 ? "text-ember" : "text-amber")}>{score}</div>
            <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500 2xl:text-[11px] 2xl:tracking-[0.35em]">{score >= 80 ? "Critical" : score ? "Elevated" : "Idle"}</div>
          </div>
        </div>
        <div className="w-full min-w-0 space-y-3 text-sm">
          <Metric label="Agent findings" value={result ? String(result.agentFindings.length) : "—"} hot={Boolean(result && score >= 76)} />
          <Metric label="MITRE mapped" value={result ? String(result.mitreMappings.length) : "—"} hot={Boolean(result && result.mitreMappings.length >= 4)} />
          <Metric label="Result source" value={resultSource} mint={result?.meta?.usedOpenAI} />
          <Metric label="Confidence" value={result ? `${result.confidence}%` : "—"} />
          <div className="pt-2 font-semibold text-ember">{score >= 84 ? label : score ? "Investigation in progress" : "Awaiting signal"}</div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, hot, mint }: { label: string; value: string; hot?: boolean; mint?: boolean }) {
  return <div className="flex justify-between gap-4"><span className="text-slate-500">{label}</span><span className={cn("font-mono", hot && "text-orange-400", mint && "text-mint")}>{value}</span></div>;
}
