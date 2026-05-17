import Link from "next/link";
import { ArrowRight, Bot, Braces, CheckCircle2, GitPullRequestArrow, Network, RadioTower, Shield, ShieldAlert, Sparkles, TerminalSquare, Zap } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const agents = [
  { name: "Intake Agent", role: "First responder triage", color: "amber", status: "complete", copy: "5 weak signals clustered in 40 minutes" },
  { name: "Auth Agent", role: "Identity & secrets", color: "cobalt", status: "complete", copy: "Moscow login + prod secret read" },
  { name: "Code Agent", role: "Source & dependencies", color: "violet", status: "complete", copy: "Typosquat deployed to production" },
  { name: "Network Agent", role: "Egress & traffic", color: "cobalt", status: "complete", copy: "10.4GB HTTPS egress to unknown IP" },
  { name: "Master Correlation Agent", role: "Incident command", color: "amber", status: "critical", copy: "Credential theft → exfiltration" },
  { name: "Remediation Agent", role: "Containment planning", color: "mint", status: "ready", copy: "Keys, pipeline, dependency PR" },
] as const;

const telemetry = [
  ["09:12:00", "Auth", "Login from Moscow on unknown Linux Chrome", "HIGH"],
  ["09:18:00", "Secrets", "PROD_PAYMENT_GATEWAY_KEY accessed", "HIGH"],
  ["09:31:00", "GitHub", "minor utility cleanup adds lodash-utilz", "CRITICAL"],
  ["09:36:48", "CI/CD", "deploy-production completed", "HIGH"],
  ["09:52:00", "Network", "10.4GB outbound HTTPS to 45.77.88.21", "CRITICAL"],
] as const;

const chain = ["Credential Theft", "Secret Access", "Malicious Dependency", "Data Exfiltration"];
const mitre = ["T1078", "T1552", "T1195", "T1041"];

export default function LandingPage() {
  return (
    <main className="min-h-screen max-w-full overflow-x-hidden bg-shell/85 text-slate-100">
      <LandingHeader />
      <section className="relative border-b border-line">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:56px_56px] opacity-40" />
        <div className="relative mx-auto grid max-w-[1560px] grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(620px,1.1fr)] lg:py-16 2xl:gap-12">
          <HeroCopy />
          <SocPreview />
        </div>
      </section>
      <AgentSystem />
      <AttackStory />
      <OutcomeStrip />
    </main>
  );
}

function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-shell/90 px-4 py-4 backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-[1560px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-ember/25 bg-ember/10 shadow-glow"><Shield className="h-5 w-5 text-ember" /></div>
          <div className="min-w-0">
            <div className="truncate text-xl font-semibold">IncidentIQ</div>
            <div className="truncate text-sm text-slate-500">Autonomous AI SOC for Startups</div>
          </div>
          <div className="ml-4 hidden min-w-0 flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500 md:flex">
            <span>demo · supply-chain scenario</span>
            <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-mint" />swarm online</span>
          </div>
        </div>
        <nav className="flex items-center gap-3">
          <a href="#agent-system" className="rounded-lg border border-line bg-white/[0.04] px-4 py-2 text-sm text-slate-300 transition hover:bg-white/[0.08]">View Agent Swarm</a>
          <Link href="/dashboard" className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-red-500">Run Live Scenario <ArrowRight className="ml-1 inline h-4 w-4" /></Link>
        </nav>
      </div>
    </header>
  );
}

function HeroCopy() {
  return (
    <div className="flex min-w-0 flex-col justify-between gap-10">
      <div className="animate-fadeUp">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <span className="rounded border border-ember/30 bg-ember/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.24em] text-ember">Critical demo scenario</span>
          <span className="rounded border border-mint/30 bg-mint/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.24em] text-mint">OpenAI agents + deterministic fallback</span>
        </div>
        <h1 className="max-w-4xl text-balance text-5xl font-black leading-[0.95] tracking-[-0.06em] text-slate-50 sm:text-6xl xl:text-7xl 2xl:text-8xl">
          AI agents that connect weak security alerts into one attack story.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400 sm:text-xl">
          IncidentIQ turns scattered startup telemetry—auth, secrets, code, CI/CD, and VPC flow logs—into a live SOC investigation with specialist agents, executive findings, and a remediation PR.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/dashboard" className="rounded-xl bg-ember px-5 py-4 text-center font-semibold text-white shadow-glow transition hover:bg-red-500">Run Live Scenario <Sparkles className="ml-2 inline h-4 w-4" /></Link>
          <a href="#agent-system" className="rounded-xl border border-line bg-white/[0.04] px-5 py-4 text-center font-semibold text-slate-200 transition hover:border-cobalt/40 hover:bg-cobalt/10">View Agent Swarm</a>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <HeroMetric label="Final risk" value="84" detail="Critical" hot />
        <HeroMetric label="Demo length" value="<3m" detail="Click-to-report" />
        <HeroMetric label="Integrations" value="0" detail="Mock data only" mint />
      </div>
    </div>
  );
}

function HeroMetric({ label, value, detail, hot, mint }: { label: string; value: string; detail: string; hot?: boolean; mint?: boolean }) {
  return <div className="rounded-xl border border-line bg-black/25 p-4"><div className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-500">{label}</div><div className={cn("mt-2 font-mono text-4xl font-black", hot ? "text-ember" : mint ? "text-mint" : "text-slate-100")}>{value}</div><div className="mt-1 text-sm text-slate-500">{detail}</div></div>;
}

function SocPreview() {
  return (
    <div className="min-w-0 animate-fadeUp rounded-2xl border border-line bg-panel/80 shadow-2xl shadow-black/40 [animation-delay:120ms]">
      <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="font-mono text-xs uppercase tracking-[0.28em] text-slate-500">Live SOC preview</div>
        <div className="flex items-center gap-2 font-mono text-xs text-mint"><span className="h-2 w-2 rounded-full bg-mint shadow-[0_0_14px_#19d39b]" />all agents completed</div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)]">
        <div className="border-b border-line p-5 xl:border-b-0 xl:border-r">
          <div className="relative mx-auto grid h-40 w-40 place-items-center rounded-full animate-pulseRing" style={{ background: "conic-gradient(#ff454b 302deg, rgba(255,255,255,.08) 0deg)" }}>
            <div className="absolute inset-3 rounded-full bg-shell shadow-[inset_0_0_40px_rgba(255,69,75,.22)]" />
            <div className="relative text-center"><div className="font-mono text-5xl font-black text-ember">84</div><div className="mt-2 font-mono text-[10px] uppercase tracking-[0.32em] text-slate-500">Critical</div></div>
          </div>
          <div className="mt-5 space-y-2 text-sm"><PreviewMetric label="Confidence" value="84%" /><PreviewMetric label="MITRE mapped" value="4" hot /><PreviewMetric label="PR result" value="ready" mint /></div>
        </div>
        <div className="min-w-0 p-4 sm:p-5">
          <div className="space-y-2">
            {telemetry.map(([time, source, text, severity]) => <TelemetryRow key={`${time}-${source}`} time={time} source={source} text={text} severity={severity} />)}
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
            {chain.map((stage, index) => <div key={stage} className={cn("rounded-xl border p-3", index === 2 ? "border-violet/40 bg-violet/10" : "border-cobalt/35 bg-cobalt/10")}><div className="mb-2 font-mono text-[10px] text-slate-500">0{index + 1}</div><div className="break-words text-sm font-semibold text-slate-100">{stage}</div></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewMetric({ label, value, hot, mint }: { label: string; value: string; hot?: boolean; mint?: boolean }) {
  return <div className="flex justify-between gap-4"><span className="text-slate-500">{label}</span><span className={cn("font-mono", hot && "text-orange-400", mint && "text-mint")}>{value}</span></div>;
}

function TelemetryRow({ time, source, text, severity }: { time: string; source: string; text: string; severity: string }) {
  return <div className={cn("grid min-w-0 grid-cols-[72px_78px_minmax(0,1fr)] gap-2 rounded-lg border border-line bg-white/[0.025] px-3 py-3 text-sm", severity === "CRITICAL" && "border-ember/30 shadow-[inset_3px_0_0_#ff454b]")}><span className="font-mono text-xs text-slate-500">{time}</span><span className="rounded border border-white/10 px-2 py-0.5 text-center font-mono text-[10px] text-slate-400">{source}</span><span className="min-w-0 break-words text-slate-200">{text}</span></div>;
}

function AgentSystem() {
  return (
    <section id="agent-system" className="border-b border-line px-4 py-12 sm:px-6 lg:py-16">
      <div className="mx-auto max-w-[1560px]">
        <SectionHeading eyebrow="Agent system" title="Six product agents, one incident commander." copy="The landing page previews the same specialists that run inside the dashboard. Each agent receives scoped evidence and returns structured findings for the final report." />
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => <AgentTile key={agent.name} {...agent} />)}
        </div>
      </div>
    </section>
  );
}

function AgentTile({ name, role, color, status, copy }: { name: string; role: string; color: "amber" | "cobalt" | "violet" | "mint"; status: string; copy: string }) {
  const iconClass = color === "amber" ? "text-amber border-amber/30 bg-amber/10" : color === "cobalt" ? "text-cobalt border-cobalt/30 bg-cobalt/10" : color === "violet" ? "text-violet border-violet/30 bg-violet/10" : "text-mint border-mint/30 bg-mint/10";
  return <article className="relative overflow-hidden rounded-xl border border-line bg-panel2/80 p-4 transition hover:border-white/15 hover:bg-panel2"><div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" /><div className="flex items-start gap-3"><div className={cn("rounded-lg border p-2", iconClass)}><Bot className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h3 className="truncate text-sm font-semibold text-slate-100">{name}</h3><span className="rounded-md border border-mint/30 bg-mint/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-mint">{status}</span></div><p className="mt-1 text-xs font-mono text-slate-500">{role}</p></div></div><p className="mt-4 min-h-[44px] text-sm leading-6 text-slate-400">{copy}</p><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className={cn("h-full rounded-full", color === "violet" ? "bg-violet" : color === "mint" ? "bg-mint" : color === "amber" ? "bg-amber" : "bg-cobalt")} style={{ width: "100%" }} /></div></article>;
}

function AttackStory() {
  return (
    <section className="border-b border-line px-4 py-12 sm:px-6 lg:py-16">
      <div className="mx-auto max-w-[1560px]">
        <SectionHeading eyebrow="Attack story" title="A 40-minute chain hiding in plain sight." copy="Individually, every alert looks explainable. Correlated together, they show a compromised developer account, dependency injection, production deployment, and anomalous egress." />
        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-4">
          {chain.map((stage, index) => <StoryPanel key={stage} stage={stage} index={index} />)}
        </div>
      </div>
    </section>
  );
}

function StoryPanel({ stage, index }: { stage: string; index: number }) {
  const icons = [ShieldAlert, Braces, GitPullRequestArrow, Network];
  const Icon = icons[index];
  const copy = ["Valid MFA-backed login from a new geography and device.", "Production payment gateway key accessed six minutes later.", "Lookalike package added under an innocent cleanup message.", "10.4GB HTTPS transfer after deploy to an unapproved IP."][index];
  return <article className={cn("rounded-2xl border bg-white/[0.025] p-5", index === 2 ? "border-violet/35" : index === 3 ? "border-ember/35" : "border-line")}><div className="mb-5 flex items-center justify-between"><div className="grid h-11 w-11 place-items-center rounded-xl border border-cobalt/30 bg-cobalt/10 text-cobalt"><Icon className="h-5 w-5" /></div><span className="font-mono text-xs text-slate-500">0{index + 1}</span></div><h3 className="text-lg font-semibold text-slate-100">{stage}</h3><p className="mt-3 text-sm leading-6 text-slate-500">{copy}</p></article>;
}

function OutcomeStrip() {
  return (
    <section className="px-4 py-12 sm:px-6 lg:py-16">
      <div className="mx-auto max-w-[1560px] rounded-2xl border border-line bg-black/25 p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_1fr_1.2fr]">
          <OutcomeCard icon={RadioTower} label="Critical Risk" value="84" detail="Final incident score" hot />
          <OutcomeCard icon={CheckCircle2} label="Confidence" value="84%" detail="Master Agent assessment" mint />
          <OutcomeCard icon={TerminalSquare} label="MITRE ATT&CK" value={mitre.join(" · ")} detail="Required mappings covered" />
          <OutcomeCard icon={GitPullRequestArrow} label="Remediation PR" value="Generated or fallback" detail="No GitHub integration, demo-safe output" violet />
        </div>
        <div className="mt-6 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500"><Zap className="mr-2 inline h-4 w-4 text-amber" />No auth, database, cloud, or GitHub calls required. OpenAI runs only from the dashboard API route after the scenario starts.</div>
          <Link href="/dashboard" className="w-fit rounded-xl bg-ember px-5 py-3 font-semibold text-white shadow-glow transition hover:bg-red-500">Open dashboard <ArrowRight className="ml-2 inline h-4 w-4" /></Link>
        </div>
      </div>
    </section>
  );
}

function OutcomeCard({ icon: Icon, label, value, detail, hot, mint, violet }: { icon: typeof Shield; label: string; value: string; detail: string; hot?: boolean; mint?: boolean; violet?: boolean }) {
  return <div className="rounded-xl border border-line bg-white/[0.025] p-4"><div className="mb-4 flex items-center gap-3"><div className={cn("grid h-10 w-10 place-items-center rounded-lg border", hot ? "border-ember/30 bg-ember/10 text-ember" : mint ? "border-mint/30 bg-mint/10 text-mint" : violet ? "border-violet/30 bg-violet/10 text-violet" : "border-cobalt/30 bg-cobalt/10 text-cobalt")}><Icon className="h-5 w-5" /></div><div className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">{label}</div></div><div className={cn("break-words font-mono text-2xl font-black", hot ? "text-ember" : mint ? "text-mint" : violet ? "text-violet" : "text-slate-100")}>{value}</div><div className="mt-2 text-sm text-slate-500">{detail}</div></div>;
}

function SectionHeading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return <div className="max-w-4xl"><div className="font-mono text-xs uppercase tracking-[0.32em] text-ember">{eyebrow}</div><h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-50 sm:text-4xl lg:text-5xl">{title}</h2><p className="mt-4 text-lg leading-8 text-slate-500">{copy}</p></div>;
}
