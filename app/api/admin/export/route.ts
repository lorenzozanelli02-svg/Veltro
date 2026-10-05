import { adminGuard } from "@/lib/api";
import { toCsv } from "@/lib/csv";
import { listSizeRows } from "@/lib/data";

export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;
  return new Response(toCsv(listSizeRows()), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="SizeChart-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
