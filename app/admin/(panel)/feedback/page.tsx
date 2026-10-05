import { th, td } from "@/components/admin/ui";
import { fitFeedbackSummary } from "@/lib/data";

function pct(n: number, total: number) {
  return total ? `${Math.round((n / total) * 100)}%` : "—";
}

export default function FeedbackPage() {
  const rows = fitFeedbackSummary();
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Fit feedback</h1>
      <p className="mt-1 text-sm text-muted">
        Answers to &ldquo;Did this fit?&rdquo; per brand pair. Many &ldquo;too small&rdquo; or &ldquo;too big&rdquo; answers suggest a chart needs checking.
      </p>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-soft">
            <tr>
              {["From", "To", "For", "Answers", "Too small", "Perfect", "Too big"].map((h) => (
                <th key={h} scope="col" className={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={`${r.from_brand}|${r.to_brand}|${r.gender}|${r.category}`}>
                <td className={`${td} font-medium`}>{r.from_brand}</td>
                <td className={`${td} font-medium`}>{r.to_brand}</td>
                <td className={`${td} text-muted`}>{r.gender} {r.category}</td>
                <td className={`${td} font-semibold tabular-nums`}>{r.total}</td>
                <td className={`${td} tabular-nums`}>{r.too_small} <span className="text-faint">({pct(r.too_small, r.total)})</span></td>
                <td className={`${td} tabular-nums text-good`}>{r.perfect} <span className="text-faint">({pct(r.perfect, r.total)})</span></td>
                <td className={`${td} tabular-nums`}>{r.too_big} <span className="text-faint">({pct(r.too_big, r.total)})</span></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="px-3 py-8 text-center text-muted">No feedback yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
