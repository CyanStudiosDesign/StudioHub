import type { ReactNode } from "react";
import { CalendarDays } from "lucide-react";

type AuthPageShellProps = { children: ReactNode };

export default function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <main className="app-theme min-h-screen overflow-hidden bg-canvas text-fg">
      <section className="grid min-h-screen w-full lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative flex min-h-[42vh] overflow-hidden bg-[#0a0d0c] px-8 py-10 text-white sm:px-14 lg:min-h-screen lg:px-[8vw] lg:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_18%,rgba(21,173,145,0.34),transparent_28%),radial-gradient(circle_at_15%_85%,rgba(12,96,82,0.28),transparent_34%),linear-gradient(145deg,#101312_0%,#0a0d0c_55%,#07110f_100%)]" />
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:36px_36px]" />

          <div className="relative flex min-h-full w-full flex-col">
            <div className="flex items-center gap-3 text-lg font-semibold tracking-tight">
              <span className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 shadow-[0_0_30px_rgba(21,173,145,0.18)]">
                <CalendarDays className="size-5 text-[#4ad7bb]" />
              </span>
              TuesdaySpace
            </div>

            <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-14">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#52d8be]">One space for the whole week</p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Turn plans into progress.
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-7 text-white/58">
                Bring documents, projects, creative reviews, and team updates together in TuesdaySpace.
              </p>

              <div className="mt-10 space-y-3">
                {[
                  ["1", "Join your workspace"],
                  ["2", "Plan projects together"],
                  ["3", "Ship work with clarity"],
                ].map(([number, label], index) => (
                  <div key={number} className={`flex h-16 items-center gap-4 rounded-2xl border px-4 text-sm backdrop-blur-md ${index === 0 ? "border-[#41cdb1]/40 bg-[#153c34] text-white shadow-[0_20px_60px_rgba(5,90,75,0.24)]" : "border-white/8 bg-white/[0.04] text-white/72"}`}>
                    <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${index === 0 ? "bg-[#42d1b5] text-[#07110f]" : "bg-white/8 text-white/70 ring-1 ring-white/10"}`}>{number}</span>
                    <span className="font-semibold">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-white/32">TuesdaySpace · Your team, in sync.</p>
          </div>
        </div>

        <div className="relative flex min-h-[58vh] items-center justify-center border-t border-border bg-canvas px-8 py-12 sm:px-14 lg:min-h-screen lg:border-l lg:border-t-0 lg:px-[8vw]">
          <div className="relative w-full max-w-[27rem]">
            <div className="mb-9">
              <p className="text-sm font-semibold text-primary">Welcome to TuesdaySpace</p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-fg">Sign in to your account</h1>
              <p className="mt-4 max-w-sm text-sm leading-6 text-fg-muted">Use your work email to continue to your workspace.</p>
            </div>
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
