import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/ui/sidebar/AppShell";
import { createClient } from "@/utils/supabase/server";
import type {
  CreativePost,
  CreativeVersion,
  Profile,
  Database,
} from "@/types/supabase";
import { createCreativePost } from "../actions";
import ActivityFeed from "../_components/ActivityFeed";
import CampaignHeader from "../_components/CampaignHeader";
import CreativeGrid from "../_components/CreativeGrid";

type CampaignPageProps = {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<{
    q?: string;
    status?: Database["public"]["Enums"]["creative_post_status"];
    media?: Database["public"]["Enums"]["creative_media_type"];
  }>;
};

const completedStatuses = new Set(["selected", "published", "rejected"]);

function isPostStatus(
  status: string | undefined,
): status is Database["public"]["Enums"]["creative_post_status"] {
  return [
    "draft",
    "improvement_required",
    "selected",
    "rejected",
    "published",
    "archived",
  ].includes(status ?? "");
}

function isMediaType(
  media: string | undefined,
): media is Database["public"]["Enums"]["creative_media_type"] {
  return ["image", "video", "pdf", "other"].includes(media ?? "");
}

export default async function CampaignPage({
  params,
  searchParams,
}: CampaignPageProps) {
  const { campaignId } = await params;
  const filters = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: campaign, error: campaignError } = await supabase
    .from("creative_campaigns")
    .select("id, workspace_id, title, description, status, created_by, created_at, updated_at")
    .eq("id", campaignId)
    .maybeSingle();

  if (campaignError) {
    throw new Error(campaignError.message);
  }

  if (!campaign) {
    notFound();
  }

  let postsQuery = supabase
    .from("creative_posts")
    .select(
      "id, campaign_id, workspace_id, title, description, owner_id, current_status, current_version_id, created_by, created_at, updated_at",
    )
    .eq("campaign_id", campaign.id)
    .order("updated_at", { ascending: false });

  if (filters.q) {
    postsQuery = postsQuery.ilike("title", `%${filters.q}%`);
  }

  if (isPostStatus(filters.status)) {
    postsQuery = postsQuery.eq("current_status", filters.status);
  }

  const { data: posts, error: postsError } = await postsQuery;

  if (postsError) {
    throw new Error(postsError.message);
  }

  const postIds = posts.map((post) => post.id);
  const { data: versions, error: versionsError } = postIds.length
    ? await supabase
        .from("creative_versions")
        .select(
          "id, post_id, workspace_id, version_number, uploaded_by, storage_path, preview_url, file_name, file_size, mime_type, media_type, notes, is_active_draft, is_approved, created_at",
        )
        .in("post_id", postIds)
        .order("version_number", { ascending: false })
    : { data: [], error: null };

  if (versionsError) {
    throw new Error(versionsError.message);
  }

  const { data: assignees, error: assigneesError } = postIds.length
    ? await supabase
        .from("creative_post_assignees")
        .select("post_id, user_id")
        .in("post_id", postIds)
    : { data: [], error: null };

  if (assigneesError) {
    throw new Error(assigneesError.message);
  }

  const { data: workspaceMembers, error: workspaceMembersError } =
    await supabase
      .from("workspace_members")
      .select("user_id, role")
      .eq("workspace_id", campaign.workspace_id)
      .order("created_at", { ascending: true });

  if (workspaceMembersError) {
    throw new Error(workspaceMembersError.message);
  }

  const profileIds = Array.from(
    new Set([
      ...workspaceMembers.map((member) => member.user_id),
      ...posts.flatMap((post) => (post.owner_id ? [post.owner_id] : [])),
      ...posts.map((post) => post.created_by),
      ...assignees.map((assignee) => assignee.user_id),
    ]),
  );
  const { data: profiles, error: profilesError } = profileIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, email, full_name, date_of_birth, avatar_url, created_at, updated_at")
        .in("id", profileIds)
    : { data: [], error: null };

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const { data: activities, error: activitiesError } = await supabase
    .from("creative_activity")
    .select("id, workspace_id, campaign_id, post_id, version_id, actor_id, type, message, metadata, created_at")
    .eq("campaign_id", campaign.id)
    .order("created_at", { ascending: false })
    .limit(12);

  if (activitiesError) {
    throw new Error(activitiesError.message);
  }

  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const versionsByPost = new Map<string, CreativeVersion>();
  for (const post of posts) {
    const current =
      versions.find((version) => version.id === post.current_version_id) ??
      versions.find((version) => version.post_id === post.id);
    if (current) versionsByPost.set(post.id, current);
  }

  const filteredPosts = isMediaType(filters.media)
    ? posts.filter((post) => versionsByPost.get(post.id)?.media_type === filters.media)
    : posts;

  const assigneesByPost = new Map<string, Profile[]>();
  for (const post of posts) {
    assigneesByPost.set(
      post.id,
      assignees
        .filter((assignee) => assignee.post_id === post.id)
        .map((assignee) => profileMap.get(assignee.user_id))
        .filter((profile): profile is Profile => Boolean(profile)),
    );
  }

  const involvedMembers = Array.from(
    new Set([
      ...posts.flatMap((post) => (post.owner_id ? [post.owner_id] : [])),
      ...assignees.map((assignee) => assignee.user_id),
    ]),
  )
    .map((id) => profileMap.get(id))
    .filter((profile): profile is Profile => Boolean(profile));
  const completedCount = posts.filter((post) =>
    completedStatuses.has(post.current_status),
  ).length;

  return (
    <AppShell workspaceId={campaign.workspace_id}>
      <main className="min-h-screen px-6 py-10 text-zinc-950">
        <div className="mx-auto max-w-7xl space-y-6">
          <CampaignHeader
            campaign={campaign}
            creativeCount={posts.length}
            completedCount={completedCount}
            members={involvedMembers}
          />

          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <section className="space-y-5">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <form className="grid gap-3 md:grid-cols-[1fr_180px_160px_auto]">
                  <input
                    name="q"
                    defaultValue={filters.q ?? ""}
                    placeholder="Search creative title"
                    className="h-11 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-950"
                  />
                  <select
                    name="status"
                    defaultValue={filters.status ?? ""}
                    className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-950"
                  >
                    <option value="">All statuses</option>
                    <option value="draft">Draft</option>
                    <option value="improvement_required">
                      Improvement Required
                    </option>
                    <option value="selected">Selected</option>
                    <option value="rejected">Rejected</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                  <select
                    name="media"
                    defaultValue={filters.media ?? ""}
                    className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-950"
                  >
                    <option value="">All media</option>
                    <option value="image">Images</option>
                    <option value="video">Videos</option>
                    <option value="pdf">PDFs</option>
                  </select>
                  <button className="h-11 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800">
                    Filter
                  </button>
                </form>
              </div>

              <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3 text-sm font-medium">
                {["Creatives", "Activity", "Members", "Settings"].map((tab) => (
                  <span
                    key={tab}
                    className="rounded-full bg-white px-3 py-1.5 text-zinc-600 ring-1 ring-zinc-200"
                  >
                    {tab}
                  </span>
                ))}
              </div>

              <CreativeGrid
                posts={filteredPosts as CreativePost[]}
                versionsByPost={versionsByPost}
                profilesById={profileMap}
                assigneesByPost={assigneesByPost}
              />
            </section>

            <aside className="space-y-5">
              <form
                action={createCreativePost}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <h2 className="text-lg font-semibold tracking-tight">
                  Create creative
                </h2>
                <input type="hidden" name="workspaceId" value={campaign.workspace_id} />
                <input type="hidden" name="campaignId" value={campaign.id} />
                <div className="mt-4 space-y-3">
                  <input
                    name="title"
                    required
                    minLength={2}
                    maxLength={180}
                    placeholder="Instagram Static #1"
                    className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-950"
                  />
                  <textarea
                    name="description"
                    placeholder="Creative brief or direction"
                    className="min-h-24 w-full resize-none rounded-xl border border-zinc-200 px-3 py-3 text-sm outline-none focus:border-zinc-950"
                  />
                  <select
                    name="ownerId"
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-950"
                  >
                    <option value="">No owner</option>
                    {workspaceMembers.map((member) => {
                      const profile = profileMap.get(member.user_id);
                      return (
                        <option key={member.user_id} value={member.user_id}>
                          {profile?.full_name ||
                            profile?.username ||
                            member.user_id}
                        </option>
                      );
                    })}
                  </select>
                  <button className="h-11 w-full rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800">
                    Create post
                  </button>
                </div>
              </form>

              <ActivityFeed
                activities={activities}
                profilesById={profileMap}
              />

              <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold tracking-tight">
                    Members
                  </h2>
                  <Link
                    href={`/workspaces/${campaign.workspace_id}/settings`}
                    className="text-sm font-medium text-zinc-500 hover:text-zinc-950"
                  >
                    Permissions
                  </Link>
                </div>
                <div className="mt-4 space-y-2">
                  {workspaceMembers.map((member) => {
                    const profile = profileMap.get(member.user_id);
                    return (
                      <div
                        key={member.user_id}
                        className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-zinc-800">
                          {profile?.full_name || profile?.username || "Member"}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {member.role}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
