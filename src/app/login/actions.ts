"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/action";
import { setAppSessionCookie } from "@/utils/auth-session-cookie";
import type { AuthFormState } from "@/app/_components/auth-types";

function cleanEmail(formData: FormData) {
  return String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
}

export async function authenticateWithEmail(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const intent = String(formData.get("intent") ?? "lookup");
  const email = cleanEmail(formData);

  if (intent === "reset") {
    return { mode: "email", email };
  }

  if (!email) {
    return { mode: "email", error: "Email is required." };
  }

  const supabase = await createClient();

  if (intent === "lookup") {
    const { data: profile, error } = await supabase
      .rpc("lookup_profile_by_email", { p_email: email })
      .maybeSingle();

    if (error) {
      return {
        mode: "email",
        email,
        error: error.message,
      };
    }

    if (profile) {
      return {
        mode: "login",
        email,
        username: profile.username,
        fullName: profile.full_name,
      };
    }

    return {
      mode: "signup",
      email,
    };
  }

  const password = String(formData.get("password") ?? "");

  if (intent === "login") {
    if (!password) {
      return { mode: "login", email, error: "Password is required." };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const { data: profile } = await supabase
        .rpc("lookup_profile_by_email", { p_email: email })
        .maybeSingle();

      return {
        mode: "login",
        email,
        username: profile?.username,
        fullName: profile?.full_name,
        error: error.message,
      };
    }

    await setAppSessionCookie();
    redirect("/");
  }

  if (intent !== "signup") {
    return { mode: "email", email, error: "Invalid auth action." };
  }

  const username = String(formData.get("username") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const dob = String(formData.get("dob") ?? "").trim();
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!username || !fullName || !dob || !password || !confirmPassword) {
    return { mode: "signup", email, error: "All fields are required." };
  }

  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
    return {
      mode: "signup",
      email,
      error:
        "Username must be 3-24 characters using letters, numbers, or underscores.",
    };
  }

  if (password !== confirmPassword) {
    return { mode: "signup", email, error: "Passwords do not match." };
  }

  const { data: usernameTaken, error: usernameError } = await supabase.rpc(
    "username_exists",
    { p_username: username },
  );

  if (usernameError) {
    return { mode: "signup", email, error: usernameError.message };
  }

  if (usernameTaken) {
    return { mode: "signup", email, error: "Username is already taken." };
  }

  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        full_name: fullName,
        dob,
      },
    },
  });

  if (signUpError) {
    return { mode: "signup", email, error: signUpError.message };
  }

  if (!data.user?.id) {
    return {
      mode: "signup",
      email,
      error: "Unable to create account. Please try again.",
    };
  }

  if (!data.session) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return {
        mode: "login",
        email,
        username,
        fullName,
        error:
          "Account created, but automatic sign-in is blocked. Disable email confirmation in Supabase Auth settings to remove the verify-email step.",
      };
    }
  }

  await setAppSessionCookie();
  redirect("/");
}
