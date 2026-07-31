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
          <label htmlFor="email" className="block text-xs font-semibold text-fg-muted">
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
            className="h-[3.35rem] w-full rounded-xl border border-border bg-surface px-5 text-sm text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>
      ) : (
        <>
          <input type="hidden" name="email" value={state.email ?? ""} />
          {isLogin ? (
            <div className="rounded-2xl border border-border bg-subtle px-5 py-4">
              <p className="text-xs font-medium text-fg-muted">Welcome back</p>
              <p className="mt-1 text-xl font-semibold text-fg">
                Hello {state.username ?? state.fullName ?? "there"}
              </p>
              <p className="mt-1 text-xs text-fg-muted">{state.email}</p>
            </div>
          ) : null}
          {isSignup ? (
            <>
              <div className="rounded-2xl border border-border bg-subtle px-5 py-4">
                <p className="text-xs font-medium text-fg-muted">
                  No account found
                </p>
                <p className="mt-1 text-lg font-semibold text-fg">
                  Create your account
                </p>
                <p className="mt-1 text-xs text-fg-muted">{state.email}</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="username"
                    className="block text-xs font-semibold text-fg-muted"
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
                    className="h-[3.35rem] w-full rounded-xl border border-border bg-surface px-5 text-sm text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="fullName"
                    className="block text-xs font-semibold text-fg-muted"
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
                    className="h-[3.35rem] w-full rounded-xl border border-border bg-surface px-5 text-sm text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="dob"
                  className="block text-xs font-semibold text-fg-muted"
                >
                  Date of birth
                </label>
                <input
                  id="dob"
                  name="dob"
                  type="date"
                  required
                  className="h-[3.35rem] w-full rounded-xl border border-border bg-surface px-5 text-sm text-fg outline-none transition-colors [color-scheme:inherit] focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>
            </>
          ) : null}

          <div className={isSignup ? "grid grid-cols-1 gap-4 sm:grid-cols-2" : ""}>
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-fg-muted"
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
                className="h-[3.35rem] w-full rounded-xl border border-border bg-surface px-5 text-sm text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>
          {isSignup ? (
              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-semibold text-fg-muted"
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
                  className="h-[3.35rem] w-full rounded-xl border border-border bg-surface px-5 text-sm text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>
            ) : null}
          </div>
        </>
      )}

      {state.error ? (
        <p className="rounded-xl border border-danger/20 bg-danger-subtle px-3 py-2 text-xs text-danger-strong">
          {state.error}
        </p>
      ) : null}

      {state.message ? (
        <p className="rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-xs text-primary">
          {state.message}
        </p>
      ) : null}

      {mode === "email" ? (
        <button
          type="submit"
          name="intent"
          value="lookup"
          disabled={pending}
          className="h-[3.35rem] w-full rounded-xl bg-primary px-4 text-sm font-semibold text-primary-fg shadow-[0_18px_44px_color-mix(in_srgb,var(--primary)_28%,transparent)] transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Checking..." : "Continue"}
        </button>
      ) : (
        <button
          type="submit"
          name="intent"
          value={isSignup ? "signup" : "login"}
          disabled={pending}
          className="h-[3.35rem] w-full rounded-xl bg-primary px-4 text-sm font-semibold text-primary-fg shadow-[0_18px_44px_color-mix(in_srgb,var(--primary)_28%,transparent)] transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
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
          className="w-full text-center text-xs font-medium text-fg-muted hover:text-fg"
        >
          Use another email
        </button>
      ) : null}
    </form>
  );
}
