import { NextResponse } from "next/server";
import { paymentsMode } from "@/lib/config";
import { isReportId } from "@/lib/ids";
import { getReport, markPaid } from "@/lib/store";


export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { id?: unknown } | null;
  const id = typeof body?.id === "string" ? body.id : "";
  if (!isReportId(id)) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const report = await getReport(id);
  if (!report) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (report.paid) return NextResponse.json({ url: `/r/${id}` });

  const mode = paymentsMode();
  if (mode === "mock") {
    // Stand-in for Stripe Checkout while building: unlocks straight away.
    await markPaid(id, `mock_${Date.now()}`);
    return NextResponse.json({ url: `/r/${id}?unlocked=1` });
  }
  return NextResponse.json({ error: "payments_unavailable" }, { status: 503 });
}
