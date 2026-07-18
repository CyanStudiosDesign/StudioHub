function LoadingLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-zinc-200 ${className}`} />;
}

function LoadingCard({ tall }: { tall?: boolean }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="size-11 animate-pulse rounded-xl bg-zinc-200" />
        <div className="flex-1 space-y-3">
          <LoadingLine className="h-4 w-2/3" />
          <LoadingLine className="h-3 w-full" />
          <LoadingLine className="h-3 w-4/5" />
        </div>
      </div>
      {tall ? (
        <div className="mt-6 space-y-3">
          <LoadingLine className="h-3 w-full" />
          <LoadingLine className="h-3 w-11/12" />
          <LoadingLine className="h-3 w-2/3" />
        </div>
      ) : null}
    </div>
  );
}

export default function AppLoading() {
  return (
    <div className="flex min-h-screen bg-[#f6f7fb] text-zinc-950">
      <aside className="hidden h-screen w-64 shrink-0 border-r border-zinc-200 bg-white p-3 sm:block">
        <div className="flex h-16 items-center justify-between border-b border-zinc-200 pb-3">
          <div className="size-10 animate-pulse rounded-xl bg-zinc-200" />
          <LoadingLine className="h-4 w-28" />
        </div>
        <div className="space-y-2 py-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex h-10 items-center gap-3 rounded-xl px-3"
            >
              <div className="size-5 animate-pulse rounded-md bg-zinc-200" />
              <LoadingLine className="h-3 w-28" />
            </div>
          ))}
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative flex size-10 items-center justify-center rounded-xl bg-zinc-950">
                <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              </div>
              <div>
                <LoadingLine className="h-4 w-32" />
                <LoadingLine className="mt-2 h-3 w-48" />
              </div>
            </div>
            <LoadingLine className="hidden h-10 w-36 rounded-xl sm:block" />
          </div>

          <section className="mb-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <LoadingLine className="h-8 w-64" />
            <LoadingLine className="mt-4 h-3 w-full max-w-2xl" />
            <LoadingLine className="mt-3 h-3 w-full max-w-xl" />
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <LoadingLine className="h-20 rounded-2xl" />
              <LoadingLine className="h-20 rounded-2xl" />
              <LoadingLine className="h-20 rounded-2xl" />
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <LoadingCard />
            <LoadingCard tall />
            <LoadingCard />
            <LoadingCard tall />
            <LoadingCard />
            <LoadingCard tall />
          </div>
        </div>
      </main>
    </div>
  );
}
