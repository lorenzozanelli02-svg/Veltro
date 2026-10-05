import { th, td } from "@/components/admin/ui";
import { brandRequestSummary, listBrandRequests } from "@/lib/data";

export default function RequestsPage() {
  const summary = brandRequestSummary();
  const recent = listBrandRequests().slice(0, 100);
  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-bold tracking-tight">Brand requests</h1>
        <p className="mt-1 text-sm text-muted">Grouped by brand name (case-insensitive), most requested first.</p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-soft">
              <tr>
                <th scope="col" className={th}>#</th>
                <th scope="col" className={th}>Brand</th>
                <th scope="col" className={th}>Requests</th>
                <th scope="col" className={th}>With email</th>
                <th scope="col" className={th}>Last requested</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {summary.map((s, i) => (
                <tr key={s.brand_name}>
                  <td className={`${td} text-muted tabular-nums`}>{i + 1}</td>
                  <td className={`${td} font-medium`}>{s.brand_name}</td>
                  <td className={`${td} font-semibold tabular-nums`}>{s.requests}</td>
                  <td className={`${td} tabular-nums`}>{s.emails}</td>
                  <td className={td}>{s.last_requested}</td>
                </tr>
              ))}
              {summary.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-muted">No requests yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      {recent.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Latest requests</h2>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-soft">
                <tr>
                  <th scope="col" className={th}>Brand</th>
                  <th scope="col" className={th}>Email</th>
                  <th scope="col" className={th}>Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recent.map((r) => (
                  <tr key={r.id}>
                    <td className={td}>{r.brand_name}</td>
                    <td className={td}>{r.email ?? <span className="text-faint">—</span>}</td>
                    <td className={td}>{r.created_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
