"use client";

import { useState } from "react";
import { ChevronDown, Copy } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { MockPrResult as MockPr } from "@/lib/types/investigation";

export function MockPrResult({ pr }: { pr?: MockPr }) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  if (!pr) return null;

  async function copyPatch() {
    try {
      await navigator.clipboard?.writeText(pr?.patch ?? "");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return <section className="min-w-0 border-t border-line p-4 sm:p-6"><div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><h2 className="font-semibold">Mock remediation PR</h2><span className={cn("w-fit rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em]", pr.source === "openai" ? "border-mint/30 bg-mint/10 text-mint" : "border-cobalt/30 bg-cobalt/10 text-cobalt")}>{pr.source === "openai" ? "OpenAI generated" : "Fallback sample"}</span></div><article className="min-w-0 rounded-xl border border-line bg-white/[0.025] p-4"><h3 className="break-words text-sm font-semibold text-slate-100">{pr.title}</h3><p className="mt-2 break-words text-xs leading-5 text-slate-400">{pr.summary}</p><div className="mt-4 flex flex-wrap gap-2">{pr.filesChanged.map((f) => <span key={f.path} className="max-w-full break-all rounded-md border border-white/10 px-2 py-1 font-mono text-[11px] text-slate-400">{f.changeType}: {f.path}</span>)}</div><div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><button onClick={() => setOpen((value) => !value)} className="w-fit rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.06]"><ChevronDown className={cn("mr-2 inline h-3.5 w-3.5 transition", open && "rotate-180")} />{open ? "Hide diff" : "Show diff"}</button><button onClick={copyPatch} className="w-fit rounded-lg border border-mint/30 bg-mint/10 px-3 py-2 text-xs font-semibold text-mint hover:bg-mint/15"><Copy className="mr-2 inline h-3.5 w-3.5" />{copied ? "Copied patch" : "Copy patch"}</button></div>{open && <pre className="thin-scrollbar mt-4 max-h-52 max-w-full overflow-auto rounded-lg border border-line bg-black/40 p-3 text-[11px] leading-5 text-slate-300">{pr.patch}</pre>}<p className="mt-3 break-words text-xs text-slate-400">{pr.riskRemovalExplanation}</p><div className="mt-4 space-y-1 border-t border-line pt-3"><div className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">Validation notes</div>{pr.validationNotes.map((note) => <p key={note} className="break-words text-xs text-slate-500">• {note}</p>)}</div></article></section>;
}
