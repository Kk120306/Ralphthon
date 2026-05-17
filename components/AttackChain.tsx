import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const STAGE_COUNT = 4;

export function AttackChain({ chain, activeCount }: { chain?: string[]; activeCount: number }) {
  const stages = chain?.length ? chain.slice(0, STAGE_COUNT) : [];

  return (
    <section className="min-w-0 border-t border-line p-4 sm:p-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-lg font-semibold">Attack chain <span className="block text-sm font-normal text-slate-500 sm:ml-2 sm:inline">reconstructed by Master Agent</span></h2><span className="font-mono text-xs text-slate-500">{Math.min(activeCount, STAGE_COUNT)}/{STAGE_COUNT} stages</span></div>
      <div className="grid grid-cols-1 gap-3 2xl:grid-cols-[1fr_28px_1fr_28px_1fr_28px_1fr]">
        {Array.from({ length: STAGE_COUNT }).map((_, index) => {
          const active = index < activeCount;
          const stage = stages[index];
          return (
            <div className="contents" key={`stage-${index}`}>
              <div className={cn("rounded-xl border p-4 transition duration-500", active ? "border-cobalt/50 bg-cobalt/10 shadow-blueglow" : "border-line bg-white/[0.02] opacity-55", index === 2 && active && "border-violet/50 bg-violet/10")}> 
                <div className="mb-3 flex items-center gap-3"><span className="rounded border border-cobalt/30 bg-cobalt/10 px-2 py-1 font-mono text-[11px] text-cobalt">0{index + 1}</span><span className="font-mono text-xs text-slate-500">{stage ? "generated" : "pending"}</span></div>
                <h3 className="font-semibold text-slate-100">{stage ?? "Awaiting Master Agent"}</h3>
                <p className="mt-2 text-sm text-slate-500">{stage ? "OpenAI/fallback incident output" : "No scenario result loaded yet."}</p>
              </div>
              {index < 3 && <div className={cn("hidden place-items-center 2xl:grid", active ? "text-ember" : "text-slate-700")}><ArrowRight /></div>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
