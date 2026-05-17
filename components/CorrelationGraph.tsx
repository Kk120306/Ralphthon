import { cn } from "@/lib/utils/cn";
import type { AgentName, RawTimelineEvent } from "@/lib/types/investigation";

const NODES = [
  { id: "login", label: "Suspicious login", source: "Auth", agent: "Auth Agent" as AgentName },
  { id: "secret", label: "Secret access", source: "Secrets", agent: "Auth Agent" as AgentName },
  { id: "dependency", label: "Dependency change", source: "GitHub", agent: "Code Agent" as AgentName },
  { id: "deploy", label: "Production deploy", source: "CI/CD", agent: "Code Agent" as AgentName },
  { id: "exfil", label: "Outbound exfiltration", source: "Network", agent: "Network Agent" as AgentName },
];

const EDGES = [
  { from: "login", to: "secret", label: "same user/IP", agent: "Auth Agent" as AgentName },
  { from: "secret", to: "dependency", label: "temporal proximity", agent: "Master Correlation Agent" as AgentName },
  { from: "dependency", to: "deploy", label: "deployed after commit", agent: "Code Agent" as AgentName },
  { from: "deploy", to: "exfil", label: "egress after deploy", agent: "Network Agent" as AgentName },
];

export function CorrelationGraph({ events, completedAgents }: { events: RawTimelineEvent[]; completedAgents: AgentName[] }) {
  const completed = new Set(completedAgents);
  const revealedSources = new Set(events.map((event) => event.source));

  return (
    <section className="min-w-0 border-t border-line p-4 sm:p-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-lg font-semibold">Correlation graph <span className="block text-sm font-normal text-slate-500 sm:ml-2 sm:inline">live attack path</span></h2><span className="font-mono text-xs text-slate-500">{events.length}/5 nodes revealed</span></div>
      <div className="rounded-xl border border-line bg-white/[0.025] p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_56px_1fr_56px_1fr_56px_1fr_56px_1fr] md:items-center">
          {NODES.map((node, index) => {
            const visible = revealedSources.has(node.source);
            const nodeComplete = completed.has(node.agent) || completed.has("Master Correlation Agent");
            const edge = EDGES[index];
            const edgeActive = edge ? completed.has(edge.agent) || completed.has("Master Correlation Agent") : false;
            return (
              <div key={node.id} className="contents">
                <div className={cn("min-w-0 rounded-xl border p-3 transition duration-500", visible ? "border-cobalt/35 bg-cobalt/10" : "border-line bg-black/20 opacity-45", nodeComplete && "border-mint/40 bg-mint/10")}>
                  <div className="mb-2 flex items-center justify-between gap-2"><span className="rounded border border-white/10 px-2 py-1 font-mono text-[10px] text-slate-400">{node.source}</span><span className={cn("h-2 w-2 rounded-full", nodeComplete ? "bg-mint shadow-[0_0_12px_#19d39b]" : visible ? "bg-cobalt" : "bg-slate-700")} /></div>
                  <h3 className="break-words text-sm font-semibold text-slate-100">{node.label}</h3>
                  <p className="mt-2 text-xs text-slate-500">{visible ? "Raw event streamed" : "Awaiting telemetry"}</p>
                </div>
                {edge && <div className={cn("hidden min-w-0 self-center text-center md:block", edgeActive ? "text-ember" : "text-slate-700")}><div className={cn("mx-auto h-px w-full", edgeActive ? "bg-ember" : "bg-line")} /><div className="mt-2 break-words font-mono text-[10px]">{edge.label}</div></div>}
              </div>
            );
          })}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 md:hidden">
          {EDGES.map((edge) => <div key={edge.label} className={cn("rounded-lg border px-3 py-2 font-mono text-[10px]", completed.has(edge.agent) || completed.has("Master Correlation Agent") ? "border-ember/30 bg-ember/10 text-ember" : "border-line bg-black/20 text-slate-600")}>{edge.label}</div>)}
        </div>
      </div>
    </section>
  );
}
