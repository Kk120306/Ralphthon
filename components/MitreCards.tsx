import type { MitreMapping } from "@/lib/types/investigation";

export function MitreCards({ mappings }: { mappings?: MitreMapping[] }) {
  const cards = mappings ?? [];

  return (
    <section className="grid min-w-0 grid-cols-1 gap-3 border-t border-line p-4 sm:p-6 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
      {cards.length === 0 ? <article className="rounded-xl border border-dashed border-line bg-white/[0.015] p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-1 2xl:col-span-2">MITRE mappings will appear after the investigation result is generated.</article> : cards.map((m) => <article className="rounded-xl border border-line bg-white/[0.025] p-4" key={m.id}><div className="font-mono text-xs text-ember">{m.id}</div><h3 className="mt-1 font-semibold text-slate-100">{m.name}</h3><p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-500">{m.reason}</p></article>)}
    </section>
  );
}
