import type { ReactNode } from "react";

type AuthPageShellProps = { children: ReactNode };

export default function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <section className="grid min-h-screen w-full lg:grid-cols-2">
        <div className="relative flex min-h-[44vh] overflow-hidden bg-black px-8 py-12 sm:px-14 lg:min-h-screen lg:px-[9vw]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#7c3cff_0%,#5430df_24%,#17103c_48%,#000000_76%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.16),transparent_28%)]" />

          <div className="relative flex min-h-full w-full flex-col justify-end">
            <div className="mx-auto w-full max-w-md pb-2 pt-16 text-center lg:pb-14">
              <h2 className="text-[2.15rem] font-semibold leading-tight tracking-tight sm:text-[2.45rem]">
                Get Start with Us
              </h2>
              <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-white/72">
                Welcome to Pathdata - Let&apos;s get you into your workspace.
              </p>

              <div className="mt-10 space-y-0 text-left">
              {[
                ["1", "Join workspace"],
                ["2", "Open a project"],
                ["3", "Start assigning tasks"],
              ].map(([number, label], index) => (
                <div key={number}>
                  <div
                    className={`flex h-16 items-center gap-4 rounded-2xl border px-4 text-sm shadow-[0_22px_54px_rgba(0,0,0,0.32)] backdrop-blur-md transition-colors ${
                      index === 0
                        ? "border-white bg-white text-[#030717]"
                        : "border-white/12 bg-white/[0.08] text-white/78"
                    }`}
                  >
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold shadow-sm ${
                        index === 0
                          ? "bg-[#030717] text-white"
                          : "bg-white/10 text-white/82 ring-1 ring-white/12"
                      }`}
                    >
                      {number}
                    </span>
                    <span>
                      <span
                        className={`block text-[0.68rem] font-semibold uppercase tracking-[0.18em] ${
                          index === 0 ? "text-zinc-500" : "text-white/38"
                        }`}
                      >
                        Step {number}
                      </span>
                      <span className="mt-0.5 block text-base font-semibold">
                        {label}
                      </span>
                    </span>
                  </div>
                  {index < 2 ? (
                    <div className="flex h-9 justify-center">
                      <div className="relative w-px bg-gradient-to-b from-white/45 to-white/10">
                        <span className="absolute bottom-0 left-1/2 size-2 -translate-x-1/2 rotate-45 border-b border-r border-white/45" />
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex min-h-[56vh] items-center justify-center overflow-hidden border-t border-white/10 bg-black px-8 py-12 sm:px-14 lg:min-h-screen lg:border-l lg:border-t-0 lg:px-[9vw]">
          <div className="relative w-full max-w-[26.25rem]">
            <div className="mb-10 text-center">
              <h1 className="text-[2.1rem] font-semibold leading-tight tracking-tight sm:text-[2.35rem]">
                Sign in account
              </h1>
              <p className="mx-auto mt-6 max-w-[18rem] text-sm leading-6 text-white/58">
                Reclaim control of your data with confidence. Secure,
                seamless, and built to empower you every step of the way.
              </p>
            </div>

            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
