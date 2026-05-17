import { NextResponse } from "next/server";
import { runInvestigation } from "@/lib/runInvestigation";
import { DEFAULT_SCENARIO_ID, getRawTimelineEvents } from "@/lib/mockIncident";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scenarioId = searchParams.get("scenarioId") ?? DEFAULT_SCENARIO_ID;
    return NextResponse.json({ rawTimeline: getRawTimelineEvents(scenarioId) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Timeline load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    let scenarioId = DEFAULT_SCENARIO_ID;
    try {
      const body = (await request.json()) as { scenarioId?: string };
      if (body.scenarioId) scenarioId = body.scenarioId;
    } catch {
      // empty body is fine — use default scenario
    }

    const result = await runInvestigation(scenarioId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Investigation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
