import { ImportForm } from "@/components/admin/ImportForm";
import { SIZE_CHART_COLUMNS } from "@/lib/types";

export default function ImportPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight">CSV import</h1>
      <p className="mt-2 text-[15px] text-muted">
        Upload a CSV into the SizeChart table. The first row must contain exactly these column headers (any order):
      </p>
      <p className="mt-3 rounded-xl bg-soft p-3 font-mono text-xs leading-relaxed break-words">{SIZE_CHART_COLUMNS.join(",")}</p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
        <li>
          <b className="text-ink">gender</b>: men or women. <b className="text-ink">category</b>: tops, bottoms or dresses.
        </li>
        <li>Measurement columns are numbers in cm and can be left empty.</li>
        <li>Nothing is imported if any row has an error — fix the file and upload again.</li>
      </ul>
      <ImportForm />
    </div>
  );
}
