import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Profiles | Studio Hub",
};

export default async function ProfilesPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, username, email, full_name, date_of_birth, avatar_url, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">
          Supabase
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Profiles
        </h1>
        <p className="mt-3 text-zinc-600">
          Signed in as {user.email}. These rows are fetched in a Server
          Component with the cookie-aware server client.
        </p>
      </div>

      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200">
        {profiles.map((profile) => (
          <li key={profile.id} className="px-4 py-3">
            <p className="font-medium">
              {profile.full_name ?? "Unnamed profile"}
            </p>
            <p className="text-sm text-zinc-500">
              @{profile.username ?? "no_username"} · {profile.email}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
