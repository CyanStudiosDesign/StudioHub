import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-subtle", className)} />;
}

export function LoadingSpinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-canvas text-fg">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-5 py-4 shadow-sm">
        <LoaderCircle className="size-5 animate-spin text-primary" aria-hidden="true" />
        <span className="text-sm font-semibold">{label}…</span>
      </div>
    </div>
  );
}

function PageHeading({ action = true }: { action?: boolean }) {
  return (
    <div className="flex items-end justify-between gap-6">
      <div className="space-y-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-10 w-72 max-w-[65vw]" />
        <Skeleton className="h-4 w-[32rem] max-w-[75vw]" />
      </div>
      {action ? <Skeleton className="hidden h-11 w-36 sm:block" /> : null}
    </div>
  );
}

function TableRows({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="grid grid-cols-[1.5fr_1fr_0.7fr_0.7fr] gap-5 border-b border-border bg-subtle/50 px-5 py-3">
        {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-3 w-20" />)}
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="grid grid-cols-[1.5fr_1fr_0.7fr_0.7fr] gap-5 border-b border-border px-5 py-4 last:border-0">
          <Skeleton className="h-4 w-4/5" /><Skeleton className="h-4 w-2/3" /><Skeleton className="h-6 w-20 rounded-full" /><Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export default function AppLoading() {
  return (
    <main className="app-theme min-h-screen bg-canvas px-6 py-10 text-fg">
      <div className="mx-auto max-w-7xl space-y-8">
        <PageHeading />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <div key={index} className="rounded-2xl border border-border bg-surface p-5"><Skeleton className="h-3 w-24" /><Skeleton className="mt-4 h-9 w-20" /><Skeleton className="mt-3 h-3 w-32" /></div>)}
        </div>
        <TableRows />
      </div>
    </main>
  );
}

export function ArticleGridLoading() {
  return (
    <main className="min-h-screen bg-canvas px-6 py-10 text-fg lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <PageHeading />
        <div className="flex gap-6 border-b border-border py-4"><Skeleton className="h-5 w-12" /><Skeleton className="h-5 w-24" /></div>
        <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <div key={index}><Skeleton className="aspect-[16/10] w-full rounded-3xl" /><Skeleton className="mt-5 h-7 w-4/5" /><Skeleton className="mt-3 h-4 w-full" /><Skeleton className="mt-2 h-4 w-2/3" /><Skeleton className="mt-4 h-3 w-1/2" /></div>)}
        </div>
      </div>
    </main>
  );
}

export function EditorLoading() {
  return (
    <main className="min-h-screen bg-canvas text-fg">
      <div className="flex min-h-20 items-center justify-between gap-6 border-b border-border px-6"><div><Skeleton className="h-3 w-20" /><Skeleton className="mt-2 h-4 w-32" /></div><div className="flex gap-2"><Skeleton className="h-10 w-32" /><Skeleton className="h-10 w-20" /><Skeleton className="h-10 w-20" /></div></div>
      <div className="mx-auto max-w-5xl px-8 py-6"><div className="mb-10 flex flex-wrap gap-2">{Array.from({ length: 14 }).map((_, index) => <Skeleton key={index} className="size-9" />)}</div><Skeleton className="h-14 w-2/3" /><Skeleton className="mt-10 h-5 w-full" /><Skeleton className="mt-4 h-5 w-11/12" /><Skeleton className="mt-4 h-5 w-3/4" /><Skeleton className="mt-10 h-40 w-full rounded-2xl" /></div>
    </main>
  );
}

export function ProjectLoading() {
  return (
    <main className="min-h-screen bg-canvas px-6 py-10 text-fg"><div className="mx-auto max-w-7xl space-y-7"><PageHeading /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-2xl" />)}</div><div className="flex gap-3 border-b border-border pb-3">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-9 w-24 rounded-full" />)}</div><div className="grid gap-4 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, column) => <div key={column} className="rounded-2xl border border-border bg-surface p-4"><Skeleton className="h-5 w-28" />{Array.from({ length: 3 }).map((_, card) => <Skeleton key={card} className="mt-4 h-28 w-full rounded-xl" />)}</div>)}</div></div></main>
  );
}

export function FeedLoading() {
  return (
    <main className="min-h-screen bg-canvas px-6 py-10 text-fg"><div className="mx-auto max-w-5xl space-y-6"><PageHeading />{Array.from({ length: 5 }).map((_, index) => <div key={index} className="rounded-2xl border border-border bg-surface p-5"><div className="flex gap-4"><Skeleton className="size-11 shrink-0" /><div className="flex-1"><Skeleton className="h-5 w-1/3" /><Skeleton className="mt-3 h-3 w-1/2" /><Skeleton className="mt-5 h-4 w-full" /><Skeleton className="mt-3 h-4 w-4/5" /></div></div></div>)}</div></main>
  );
}

export function SettingsLoading() {
  return (
    <main className="min-h-screen bg-canvas px-6 py-10 text-fg"><div className="mx-auto max-w-5xl space-y-8"><PageHeading action={false} />{Array.from({ length: 3 }).map((_, index) => <section key={index} className="rounded-2xl border border-border bg-surface p-6"><Skeleton className="h-6 w-48" /><Skeleton className="mt-3 h-4 w-80" /><div className="mt-6 grid gap-4 sm:grid-cols-2"><Skeleton className="h-11 w-full" /><Skeleton className="h-11 w-full" /><Skeleton className="h-24 w-full sm:col-span-2" /></div></section>)}</div></main>
  );
}

export { Skeleton, TableRows };
