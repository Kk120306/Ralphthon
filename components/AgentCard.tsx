import { CheckCircle2, CircleDashed, Loader2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { AgentFinding, AgentName } from "@/lib/types/investigation";

export type AgentUiStatus = "idle" | "investigating" | "complete" | "error";

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

export function AgentCard({
  name,
  status,
  finding,
}: {
  name: AgentName;
  status: AgentUiStatus;
  finding?: AgentFinding;
}) {
  const progress = status === "complete" ? 100 : status === "investigating" ? 55 : 0;
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-xl border bg-panel2/80 p-4 shadow-black/20 transition duration-300",
        status === "complete" ? "border-white/12" : status === "investigating" ? "border-ember/40 shadow-glow" : "border-line/80",
      )}
    >
      {status === "investigating" && <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ember to-transparent animate-sweep" />}
      <div className="flex items-start gap-3">
        <div className={cn("rounded-lg border p-2", ACCENT[name])}>
          {status === "complete" ? <CheckCircle2 className="h-5 w-5" /> : status === "investigating" ? <Loader2 className="h-5 w-5 animate-spin" /> : status === "error" ? <ShieldAlert className="h-5 w-5 text-ember" /> : <CircleDashed className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-slate-100">{name}</h3>
            <span className={cn("rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em]", status === "complete" ? "border-mint/30 bg-mint/10 text-mint" : status === "investigating" ? "border-ember/35 bg-ember/10 text-ember" : "border-white/10 bg-white/[0.03] text-slate-500")}>{status}</span>
          </div>
          <p className="mt-1 text-xs font-mono text-slate-500">{ROLE[name]}</p>
        </div>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div className={cn("h-full rounded-full transition-all duration-700", name.includes("Code") ? "bg-violet" : name.includes("Remediation") ? "bg-mint" : name.includes("Master") ? "bg-amber" : "bg-cobalt")} style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-3 min-h-[58px] text-xs leading-5 text-slate-400">
        {finding ? (
          <>
            <div className="mb-1 flex items-center justify-between font-mono text-[11px] text-slate-500">
              <span>{finding.severity ?? "Analysis"}</span>
              <span>{finding.confidence ? `${finding.confidence}% confidence` : "queued"}</span>
            </div>
            <p className="line-clamp-3">{finding.summary}</p>
          </>
        ) : (
          <p className="text-slate-600">Awaiting scenario execution.</p>
        )}
      </div>
    </article>
  );
}
