import { cn } from "@/lib/utils/cn";

export interface ReasoningMessage {
  agent: string;
  message: string;
  t: string;
}

const colorFor = (agent: string) =>
  agent.includes("Auth") ? "text-cobalt" : agent.includes("Code") ? "text-violet" : agent.includes("Network") ? "text-cobalt" : agent.includes("Remediation") ? "text-mint" : "text-amber";

export function ReasoningFeed({ messages }: { messages: ReasoningMessage[] }) {
  return (
    <section className="min-w-0 p-4 sm:p-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-lg font-semibold">Live agent reasoning <span className="block text-sm font-normal text-slate-500 sm:ml-2 sm:inline">thought stream from active agents</span></h2><span className="flex items-center gap-2 font-mono text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-mint shadow-[0_0_14px_#19d39b]" />{messages.length} steps</span></div>
      <div className="thin-scrollbar max-h-[430px] space-y-4 overflow-y-auto pr-3 font-mono text-sm leading-7">
        {messages.length === 0 ? <p className="text-slate-600">Run the scenario to stream specialist findings.</p> : messages.map((m, i) => (
          <div className="grid min-w-0 grid-cols-[56px_minmax(0,1fr)] gap-2 animate-fadeUp sm:grid-cols-[62px_150px_minmax(0,1fr)] 2xl:grid-cols-[70px_190px_minmax(0,1fr)] sm:gap-3" key={`${m.t}-${i}`}>
            <span className="text-slate-600">{m.t}</span>
            <span className={cn("min-w-0 truncate font-semibold", colorFor(m.agent))}>● {m.agent.toLowerCase().replaceAll(" ", ".")}</span>
            <span className="col-span-2 min-w-0 break-words text-slate-300 sm:col-span-1">{String(m.message)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
