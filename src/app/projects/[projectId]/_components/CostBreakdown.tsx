import type { ProjectFinancialEntry } from "@/types/supabase";

function money(value: number) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function CostBreakdown({
  entries,
}: {
  entries: ProjectFinancialEntry[];
}) {
  const expenses = entries.filter((entry) => !entry.is_revenue);
  const grouped = expenses.reduce<Record<string, number>>((groups, entry) => {
    groups[entry.category] = (groups[entry.category] ?? 0) + Number(entry.amount);
    return groups;
  }, {});

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight">Cost breakdown</h2>
      <div className="mt-4 space-y-2">
        {Object.entries(grouped).length ? (
          Object.entries(grouped).map(([category, amount]) => (
            <div
              key={category}
              className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2 text-sm"
            >
              <span className="font-medium text-zinc-700">{category}</span>
              <span className="font-semibold text-zinc-950">
                {money(amount)}
              </span>
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">
            No expenses recorded yet.
          </p>
        )}
      </div>
    </section>
  );
}
