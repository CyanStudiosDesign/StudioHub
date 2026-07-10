"use client";

import { useActionState } from "react";
import type { AuthFormState } from "./auth-types";

type AuthCredentialFormProps = {
  action: (
    previousState: AuthFormState,
    formData: FormData,
  ) => Promise<AuthFormState>;
};

const initialState: AuthFormState = {
  mode: "email",
};

export default function AuthCredentialForm({ action }: AuthCredentialFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const mode = state.mode ?? "email";
  const isSignup = mode === "signup";
  const isLogin = mode === "login";

  return (
    <form action={formAction} className="space-y-6">
      {mode === "email" ? (
        <div className="space-y-3">
          <label htmlFor="email" className="block text-xs font-medium text-white/75">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={state.email}
            autoComplete="email"
            required
            placeholder="Please enter email"
            className="h-[3.35rem] w-full rounded-xl border border-white/12 bg-[#030717] px-5 text-sm text-white outline-none transition-colors placeholder:text-white/28 focus:border-[#5d78ff] focus:bg-[#050a1d]"
          />
        </div>
      ) : (
        <>
          <input type="hidden" name="email" value={state.email ?? ""} />
          {isLogin ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
              <p className="text-xs font-medium text-white/50">Welcome back</p>
              <p className="mt-1 text-xl font-semibold text-white">
                Hello {state.username ?? state.fullName ?? "there"}
              </p>
              <p className="mt-1 text-xs text-white/45">{state.email}</p>
            </div>
          ) : null}
          {isSignup ? (
            <>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
                <p className="text-xs font-medium text-white/50">
                  No account found
                </p>
                <p className="mt-1 text-lg font-semibold text-white">
                  Create your account
                </p>
                <p className="mt-1 text-xs text-white/45">{state.email}</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="username"
                    className="block text-xs font-medium text-white/75"
                  >
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    pattern="^[a-zA-Z0-9_]{3,24}$"
                    placeholder="unique_name"
                    className="h-[3.35rem] w-full rounded-xl border border-white/12 bg-[#030717] px-5 text-sm text-white outline-none transition-colors placeholder:text-white/28 focus:border-[#5d78ff] focus:bg-[#050a1d]"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="fullName"
                    className="block text-xs font-medium text-white/75"
                  >
                    Full name
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    required
                    placeholder="Your full name"
                    className="h-[3.35rem] w-full rounded-xl border border-white/12 bg-[#030717] px-5 text-sm text-white outline-none transition-colors placeholder:text-white/28 focus:border-[#5d78ff] focus:bg-[#050a1d]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="dob"
                  className="block text-xs font-medium text-white/75"
                >
                  Date of birth
                </label>
                <input
                  id="dob"
                  name="dob"
                  type="date"
                  required
                  className="h-[3.35rem] w-full rounded-xl border border-white/12 bg-[#030717] px-5 text-sm text-white outline-none transition-colors [color-scheme:dark] focus:border-[#5d78ff] focus:bg-[#050a1d]"
                />
              </div>
            </>
          ) : null}

          <div className={isSignup ? "grid grid-cols-1 gap-4 sm:grid-cols-2" : ""}>
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-xs font-medium text-white/75"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                required
                minLength={6}
                placeholder="Please enter password"
                className="h-[3.35rem] w-full rounded-xl border border-white/12 bg-[#030717] px-5 text-sm text-white outline-none transition-colors placeholder:text-white/28 focus:border-[#5d78ff] focus:bg-[#050a1d]"
              />
            </div>
          {isSignup ? (
              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-medium text-white/75"
                >
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  placeholder="Confirm password"
                  className="h-[3.35rem] w-full rounded-xl border border-white/12 bg-[#030717] px-5 text-sm text-white outline-none transition-colors placeholder:text-white/28 focus:border-[#5d78ff] focus:bg-[#050a1d]"
                />
              </div>
            ) : null}
          </div>
        </>
      )}

      {state.error ? (
        <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-100">
          {state.error}
        </p>
      ) : null}

      {state.message ? (
        <p className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100">
          {state.message}
        </p>
      ) : null}

      {mode === "email" ? (
        <button
          type="submit"
          name="intent"
          value="lookup"
          disabled={pending}
          className="h-[3.35rem] w-full rounded-xl bg-[#5876ff] px-4 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(88,118,255,0.38)] transition-colors hover:bg-[#6681ff] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Checking..." : "Continue"}
        </button>
      ) : (
        <button
          type="submit"
          name="intent"
          value={isSignup ? "signup" : "login"}
          disabled={pending}
          className="h-[3.35rem] w-full rounded-xl bg-[#5876ff] px-4 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(88,118,255,0.38)] transition-colors hover:bg-[#6681ff] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending
            ? "Continuing..."
            : isSignup
              ? "Create account"
              : "Sign in"}
        </button>
      )}

      {mode !== "email" ? (
        <button
          type="submit"
          name="intent"
          value="reset"
          className="w-full text-center text-xs font-medium text-white/45 hover:text-white"
        >
          Use another email
        </button>
      ) : null}
    </form>
  );
}
