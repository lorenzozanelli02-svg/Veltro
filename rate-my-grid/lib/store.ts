import { RETENTION, storeMode } from "./config";
import { StoredReportSchema, type StoredReport } from "./report";

interface ReportStore {
  get(id: string): Promise<StoredReport | null>;
  put(report: StoredReport, ttlSeconds: number): Promise<void>;
}

/** Local development only: reports vanish when the dev server restarts. */
function memoryStore(): ReportStore {
  const g = globalThis as typeof globalThis & { __rmgReports?: Map<string, { value: string; expires: number }> };
  const map = (g.__rmgReports ??= new Map());
  return {
    async get(id) {
      const hit = map.get(id);
      if (!hit || hit.expires < Date.now()) return null;
      return JSON.parse(hit.value);
    },
    async put(report, ttlSeconds) {
      map.set(report.id, { value: JSON.stringify(report), expires: Date.now() + ttlSeconds * 1000 });
    },
  };
}

function store(): ReportStore {
  const mode = storeMode();
  if (mode === "mock") return memoryStore();
  throw new Error(mode === "off" ? "Report storage is not configured (set the Upstash Redis variables)" : "Redis store not added yet");
}

export async function getReport(id: string): Promise<StoredReport | null> {
  const raw = await store().get(id);
  if (!raw) return null;
  const parsed = StoredReportSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export async function saveReport(report: StoredReport) {
  await store().put(report, report.paid ? RETENTION.paidSeconds : RETENTION.unpaidSeconds);
}

/** Idempotent: a webhook and the return from Checkout can both confirm the same payment. */
export async function markPaid(id: string, checkoutSessionId: string): Promise<StoredReport | null> {
  const report = await getReport(id);
  if (!report) return null;
  if (report.paid) return report;
  const paid = { ...report, paid: true, paidAt: new Date().toISOString(), checkoutSessionId };
  await saveReport(paid);
  return paid;
}
