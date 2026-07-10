import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthCredentialForm from "@/app/_components/AuthCredentialForm";
import AuthPageShell from "@/app/_components/AuthPageShell";
import { createClient } from "@/utils/supabase/server";
import { authenticateWithEmail } from "./actions";

export const metadata: Metadata = {
  title: "Login | Studio Hub",
};

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <AuthPageShell>
      <AuthCredentialForm action={authenticateWithEmail} />
    </AuthPageShell>
  );
}
