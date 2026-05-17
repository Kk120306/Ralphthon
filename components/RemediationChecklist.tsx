"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function RemediationChecklist({ items }: { items: string[] }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const shown = items;
  return (
    <section className="min-w-0 border-t border-line p-4 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3 font-mono text-xs uppercase tracking-[0.24em] text-slate-500 2xl:tracking-[0.32em]"><span>Remediation · {shown.length}/{shown.length}</span><button onClick={() => setChecked(Object.fromEntries(shown.map((item) => [item, true])))} disabled={shown.length === 0} className="shrink-0 rounded-md border border-mint/30 bg-mint/10 px-3 py-2 text-mint disabled:cursor-not-allowed disabled:opacity-45">Run all</button></div>
      <div className="thin-scrollbar max-h-[430px] space-y-3 overflow-y-auto pr-2">
        {shown.length === 0 ? <div className="rounded-xl border border-dashed border-line bg-white/[0.015] p-4 text-sm text-slate-500">Generated remediation actions will appear after the scenario completes.</div> : shown.map((item, i) => {
          const label = String(item);
          return <button key={`${i}-${label}`} onClick={() => setChecked((s) => ({ ...s, [label]: !s[label] }))} className="flex w-full min-w-0 items-start gap-3 rounded-xl border border-line bg-white/[0.025] p-4 text-left transition hover:border-mint/30 hover:bg-mint/5 sm:gap-4"><span className={cn("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md border font-mono text-xs", checked[label] ? "border-mint bg-mint text-black" : "border-white/15 text-slate-500")}>{checked[label] ? <Check className="h-4 w-4" /> : String(i + 1).padStart(2, "0")}</span><span className="min-w-0"><span className={cn("block break-words font-medium", checked[label] && "text-mint line-through")}>{label}</span><span className="mt-1 block break-words text-xs text-slate-500">impact {i < 2 ? "blocks attacker, service risk managed" : i === 2 ? "removes active malicious package" : "reduces blast radius"}</span></span></button>;
        })}
      </div>
    </section>
  );
}
