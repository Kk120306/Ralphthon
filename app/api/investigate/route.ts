import { NextResponse } from "next/server";
import { runInvestigation } from "@/lib/runInvestigation";
import { DEFAULT_SCENARIO_ID } from "@/lib/mockIncident";

export const runtime = "nodejs";

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
