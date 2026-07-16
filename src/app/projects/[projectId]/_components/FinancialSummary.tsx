import type { ProjectFinancialEntry } from "@/types/supabase";

function money(value: number) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function FinancialSummary({
  entries,
}: {
  entries: ProjectFinancialEntry[];
}) {
  const revenue = entries
    .filter((entry) => entry.is_revenue)
    .reduce((sum, entry) => sum + Number(entry.amount), 0);
  const expenses = entries
    .filter((entry) => !entry.is_revenue)
    .reduce((sum, entry) => sum + Number(entry.amount), 0);
  const netProfit = revenue - expenses;
  const margin = revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
        Financials
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[
          ["Revenue", revenue],
          ["Expenses", expenses],
          ["Net profit", netProfit],
          ["Margin", `${margin}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-zinc-50 p-3">
            <p className="text-sm text-zinc-500">{label}</p>
            <p className="mt-1 text-xl font-semibold text-zinc-950">
              {typeof value === "number" ? money(value) : value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
