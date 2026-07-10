import type { ReactNode } from "react";

type AuthPageShellProps = { children: ReactNode };

export default function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#020616] text-white">
      <section className="grid min-h-screen w-full lg:grid-cols-2">
        <div className="relative flex min-h-[44vh] items-center overflow-hidden bg-[#10184a] px-8 py-12 sm:px-14 lg:min-h-screen lg:px-[9vw]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_26%_13%,rgba(113,134,255,0.78),transparent_34%),linear-gradient(139deg,#3347aa_0%,#141d58_45%,#05091f_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_100%,rgba(22,35,115,0.78),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent_42%)]" />

          <div className="relative w-full">
            <div className="max-w-sm">
              <h2 className="text-[2.15rem] font-semibold leading-tight tracking-tight sm:text-[2.45rem]">
                Get Start with Us
              </h2>
              <p className="mt-6 max-w-sm text-sm leading-6 text-white/72">
                Welcome to Pathdata - Let&apos;s create your account.
              </p>
            </div>

            <div className="mt-12 max-w-sm space-y-4">
              {[
                ["1", "Sign up your account"],
                ["2", "Verify your account"],
                ["3", "Set up your workspace"],
              ].map(([number, label], index) => (
                <div key={number}>
                  <div
                    className={`flex h-[3.35rem] items-center gap-4 rounded-lg px-4 text-sm shadow-[0_20px_42px_rgba(0,0,0,0.26)] ${
                      index === 0
                        ? "bg-white text-[#030717]"
                        : "bg-[#111947]/92 text-white/78"
                    }`}
                  >
                    <span
                      className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold ${
                        index === 0
                          ? "bg-[#030717] text-white"
                          : "bg-[#1a255f] text-white/80"
                      }`}
                    >
                      {number}
                    </span>
                    <span className="font-semibold">{label}</span>
                  </div>
                  {index < 2 ? (
                    <div className="ml-10 h-7 w-px bg-white/20" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative flex min-h-[56vh] items-center justify-center overflow-hidden border-t border-white/10 bg-[#020514] px-8 py-12 sm:px-14 lg:min-h-screen lg:border-l lg:border-t-0 lg:px-[9vw]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_8%,rgba(48,62,143,0.22),transparent_34%),linear-gradient(180deg,#030719_0%,#020514_60%,#01030c_100%)]" />
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
