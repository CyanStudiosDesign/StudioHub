import { redirect } from "next/navigation";
import AppShell from "@/components/ui/sidebar/AppShell";
import { createClient } from "@/utils/supabase/server";
import type { CreativePost, Profile } from "@/types/supabase";
import { createCampaign } from "./actions";
import CampaignCard from "./_components/CampaignCard";

const doneStatuses = new Set(["selected", "published", "rejected"]);

export default async function CreativesDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: workspaces, error: workspacesError } = await supabase
    .from("workspaces")
    .select("id, name, icon")
    .order("created_at", { ascending: false });

  if (workspacesError) {
    throw new Error(workspacesError.message);
  }

  const { data: campaigns, error: campaignsError } = await supabase
    .from("creative_campaigns")
    .select("id, workspace_id, title, description, status, created_by, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(60);

  if (campaignsError) {
    throw new Error(campaignsError.message);
  }

  const campaignIds = campaigns.map((campaign) => campaign.id);
  const { data: posts, error: postsError } = campaignIds.length
    ? await supabase
        .from("creative_posts")
        .select("id, campaign_id, workspace_id, owner_id, current_status")
        .in("campaign_id", campaignIds)
    : { data: [], error: null };

  if (postsError) {
    throw new Error(postsError.message);
  }

  const postIds = posts.map((post) => post.id);
  const { data: assignees, error: assigneesError } = postIds.length
    ? await supabase
        .from("creative_post_assignees")
        .select("post_id, user_id")
        .in("post_id", postIds)
    : { data: [], error: null };

  if (assigneesError) {
    throw new Error(assigneesError.message);
  }

  const profileIds = Array.from(
    new Set([
      ...posts.flatMap((post) => (post.owner_id ? [post.owner_id] : [])),
      ...assignees.map((assignee) => assignee.user_id),
    ]),
  );
  const { data: profiles, error: profilesError } = profileIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, username, email, avatar_url, date_of_birth, created_at, updated_at")
        .in("id", profileIds)
    : { data: [], error: null };

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const postsByCampaign = posts.reduce<Record<string, CreativePost[]>>(
    (groups, post) => {
      groups[post.campaign_id] = groups[post.campaign_id] ?? [];
      groups[post.campaign_id].push(post as CreativePost);
      return groups;
    },
    {},
  );
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const membersByCampaign = new Map<string, Profile[]>();

  for (const campaign of campaigns) {
    const campaignPosts = postsByCampaign[campaign.id] ?? [];
    const memberIds = new Set<string>();
    for (const post of campaignPosts) {
      if (post.owner_id) memberIds.add(post.owner_id);
      for (const assignee of assignees.filter(
        (item) => item.post_id === post.id,
      )) {
        memberIds.add(assignee.user_id);
      }
    }
    membersByCampaign.set(
      campaign.id,
      Array.from(memberIds)
        .map((id) => profileMap.get(id))
        .filter((profile): profile is Profile => Boolean(profile)),
    );
  }

  return (
    <AppShell>
      <main className="min-h-screen px-6 py-10 text-zinc-950">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500">
                Creative asset management
              </p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                Campaigns
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
                Track marketing creatives from upload drafts through approvals,
                feedback, and final published assets.
              </p>
            </div>

            <form
              action={createCampaign}
              className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-[180px_1fr_1fr_auto]"
            >
              <select
                name="workspaceId"
                required
                className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-950"
              >
                <option value="">Workspace</option>
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.icon} {workspace.name}
                  </option>
                ))}
              </select>
              <input
                name="title"
                required
                minLength={2}
                maxLength={180}
                placeholder="Campaign name"
                className="h-11 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-950"
              />
              <input
                name="description"
                placeholder="Short description"
                className="h-11 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-950"
              />
              <button className="h-11 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800">
                Create campaign
              </button>
            </form>
          </div>

          {campaigns.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {campaigns.map((campaign) => {
                const campaignPosts = postsByCampaign[campaign.id] ?? [];
                const completedCount = campaignPosts.filter((post) =>
                  doneStatuses.has(post.current_status),
                ).length;

                return (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    creativeCount={campaignPosts.length}
                    completedCount={completedCount}
                    members={membersByCampaign.get(campaign.id) ?? []}
                  />
                );
              })}
            </div>
          ) : (
            <section className="rounded-3xl border border-dashed border-zinc-300 bg-white p-12 text-center">
              <h2 className="text-2xl font-semibold tracking-tight">
                No creative campaigns yet
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-500">
                Create a campaign for a launch, channel, or client deliverable
                and start adding versioned creative posts.
              </p>
            </section>
          )}
        </div>
      </main>
    </AppShell>
  );
}
