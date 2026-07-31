"use client";

import {
  createContext,
  useContext,
  useOptimistic,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type FormHTMLAttributes,
  type ReactNode,
} from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

type FormAction = (formData: FormData) => Promise<void>;

type OptimisticStatus = {
  pending: boolean;
  message: string;
};

const OptimisticFormContext = createContext<OptimisticStatus>({
  pending: false,
  message: "",
});

type OptimisticFormProps = Omit<
  FormHTMLAttributes<HTMLFormElement>,
  "action" | "onSubmit"
> & {
  action: FormAction;
  children: ReactNode;
  pendingMessage?: string;
  resetOnSubmit?: boolean;
  successMessage?: string;
  successDescription?: string;
};

function restoreValues(form: HTMLFormElement, formData: FormData) {
  for (const [name, value] of formData.entries()) {
    if (typeof value !== "string") continue;
    const control = form.elements.namedItem(name);
    if (!control) continue;

    if (control instanceof RadioNodeList) {
      control.value = value;
      continue;
    }

    if (
      control instanceof HTMLInputElement ||
      control instanceof HTMLTextAreaElement ||
      control instanceof HTMLSelectElement
    ) {
      if (control instanceof HTMLInputElement && control.type === "checkbox") {
        control.checked = value === "on";
      } else {
        control.value = value;
      }
    }
  }
}

export function OptimisticForm({
  action,
  children,
  pendingMessage = "Saving…",
  resetOnSubmit = false,
  successMessage,
  successDescription,
  className,
  ...props
}: OptimisticFormProps) {
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const submissionLock = useRef(false);
  const [error, setError] = useState("");
  const [optimisticStatus, setOptimisticStatus] = useOptimistic<
    OptimisticStatus,
    OptimisticStatus
  >(
    { pending: false, message: "" },
    (_current, next) => next,
  );

  async function submit(formData: FormData) {
    if (submissionLock.current) return;
    submissionLock.current = true;
    setError("");
    setOptimisticStatus({ pending: true, message: pendingMessage });

    if (resetOnSubmit) formRef.current?.reset();

    try {
      await action(formData);
      if (successMessage) toast({ message: successMessage, description: successDescription });
    } catch (caughtError) {
      if (resetOnSubmit && formRef.current) {
        restoreValues(formRef.current, formData);
      }
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The request could not be completed.",
      );
    } finally {
      submissionLock.current = false;
    }
  }

  return (
    <OptimisticFormContext.Provider value={optimisticStatus}>
      <form ref={formRef} action={submit} className={className} {...props}>
        <fieldset disabled={optimisticStatus.pending} className="contents">
          {children}
        </fieldset>
        <p
          aria-live="polite"
          className={cn(
            "col-span-full text-sm",
            error ? "mt-2 text-danger-strong" : "sr-only",
          )}
        >
          {error || optimisticStatus.message}
        </p>
      </form>
    </OptimisticFormContext.Provider>
  );
}

type OptimisticSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel?: string;
};

export function OptimisticSubmitButton({
  children,
  pendingLabel,
  className,
  disabled,
  ...props
}: OptimisticSubmitButtonProps) {
  const { pending, message } = useContext(OptimisticFormContext);

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      aria-disabled={disabled || pending}
      className={cn(
        "inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
      {pending ? pendingLabel ?? message : children}
    </button>
  );
}
