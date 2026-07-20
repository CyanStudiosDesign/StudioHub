import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, FileText, Trash2 } from "lucide-react";
import AppShell from "@/components/ui/sidebar/AppShell";
import {
  getCoreMembership,
  getCoreWorkspace,
  SetupErrorScreen,
} from "@/lib/core-workspace";
import { createClient } from "@/utils/supabase/server";
import type { CreativeVersion, Profile } from "@/types/supabase";
import {
  approveCreativeVersion,
  assignCreativePost,
  deleteCreativePost,
  removeCreativeAssignee,
  updateCreativeStatus,
} from "../../actions";
import ActivityFeed from "../../_components/ActivityFeed";
import CommentSection from "../../_components/CommentSection";
import MemberAvatarGroup from "../../_components/MemberAvatarGroup";
import StatusBadge from "../../_components/StatusBadge";
import VersionTimeline from "../../_components/VersionTimeline";
import VersionUploader from "../../_components/VersionUploader";

type CreativeDetailPageProps = {
  params: Promise<{ postId: string }>;
  searchParams: Promise<{ versionId?: string }>;
};

function Preview({ version }: { version?: CreativeVersion }) {
  if (!version) {
    return (
      <div className="flex min-h-[460px] items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-white text-zinc-400">
        No version selected
      </div>
    );
  }

  if (version.media_type === "image" && version.preview_url) {
    return (
      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={version.preview_url}
          alt={version.file_name}
          loading="lazy"
          className="max-h-[720px] w-full object-contain"
        />
      </div>
    );
  }

  if (version.media_type === "video" && version.preview_url) {
    return (
      <video
        src={version.preview_url}
        controls
        className="max-h-[720px] w-full rounded-3xl border border-zinc-200 bg-black shadow-sm"
      />
    );
  }

  if (version.media_type === "pdf" && version.preview_url) {
    return (
      <object
        data={version.preview_url}
        type="application/pdf"
        className="h-[720px] w-full rounded-3xl border border-zinc-200 bg-white shadow-sm"
      >
        <Link
          href={version.preview_url}
          className="flex min-h-[460px] items-center justify-center gap-2 text-sm font-semibold text-zinc-700"
        >
          <FileText className="size-5" />
          Open PDF
        </Link>
      </object>
    );
  }

  return (
    <div className="flex min-h-[460px] flex-col items-center justify-center gap-3 rounded-3xl border border-zinc-200 bg-white text-zinc-500 shadow-sm">
      <FileText className="size-10" />
      <p className="text-sm font-semibold">{version.file_name}</p>
    </div>
  );
}

function displayName(profile: Profile | undefined) {
  return profile?.full_name || profile?.username || profile?.email || "Unknown";
}

export default async function CreativeDetailPage({
  params,
  searchParams,
}: CreativeDetailPageProps) {
  const { postId } = await params;
  const { versionId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { workspace: coreWorkspace, setupError } =
    await getCoreWorkspace(supabase);

  if (setupError || !coreWorkspace) {
    return <SetupErrorScreen message={setupError ?? "Workspace missing."} />;
  }

  const membership = await getCoreMembership(supabase, coreWorkspace.id, user.id);

  if (!membership) {
    redirect("/");
  }

  const { data: post, error: postError } = await supabase
    .from("creative_posts")
    .select(
      "id, campaign_id, workspace_id, title, description, owner_id, current_status, current_version_id, created_by, created_at, updated_at",
    )
    .eq("id", postId)
    .maybeSingle();

  if (postError) {
    throw new Error(postError.message);
  }

  if (!post) {
    notFound();
  }

  if (post.workspace_id !== coreWorkspace.id) {
    notFound();
  }

  const { data: campaign, error: campaignError } = await supabase
    .from("creative_campaigns")
    .select("id, workspace_id, title")
    .eq("id", post.campaign_id)
    .maybeSingle();

  if (campaignError) {
    throw new Error(campaignError.message);
  }

  if (!campaign) {
    notFound();
  }

  const { data: versions, error: versionsError } = await supabase
    .from("creative_versions")
    .select(
      "id, post_id, workspace_id, version_number, uploaded_by, storage_path, preview_url, file_name, file_size, mime_type, media_type, notes, is_active_draft, is_approved, created_at",
    )
    .eq("post_id", post.id)
    .order("version_number", { ascending: false });

  if (versionsError) {
    throw new Error(versionsError.message);
  }

  const selectedVersion =
    versions.find((version) => version.id === versionId) ??
    versions.find((version) => version.id === post.current_version_id) ??
    versions[0];

  const { data: comments, error: commentsError } = selectedVersion
    ? await supabase
        .from("creative_comments")
        .select("id, version_id, post_id, workspace_id, author_id, message, metadata, created_at")
        .eq("version_id", selectedVersion.id)
        .order("created_at", { ascending: true })
    : { data: [], error: null };

  if (commentsError) {
    throw new Error(commentsError.message);
  }

  const { data: assignees, error: assigneesError } = await supabase
    .from("creative_post_assignees")
    .select("post_id, user_id, assigned_by, created_at")
    .eq("post_id", post.id);

  if (assigneesError) {
    throw new Error(assigneesError.message);
  }

  const { data: workspaceMembers, error: workspaceMembersError } =
    await supabase
      .from("workspace_members")
      .select("user_id, role")
      .eq("workspace_id", post.workspace_id)
      .order("created_at", { ascending: true });

  if (workspaceMembersError) {
    throw new Error(workspaceMembersError.message);
  }

  const { data: activities, error: activitiesError } = await supabase
    .from("creative_activity")
    .select("id, workspace_id, campaign_id, post_id, version_id, actor_id, type, message, metadata, created_at")
    .eq("post_id", post.id)
    .order("created_at", { ascending: false })
    .limit(12);

  if (activitiesError) {
    throw new Error(activitiesError.message);
  }

  const profileIds = Array.from(
    new Set([
      post.created_by,
      ...(post.owner_id ? [post.owner_id] : []),
      ...versions.map((version) => version.uploaded_by),
      ...comments.map((comment) => comment.author_id),
      ...assignees.map((assignee) => assignee.user_id),
      ...workspaceMembers.map((member) => member.user_id),
      ...activities.flatMap((activity) =>
        activity.actor_id ? [activity.actor_id] : [],
      ),
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

  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const assigneeIds = new Set(assignees.map((assignee) => assignee.user_id));
  const assigneeProfiles = assignees
    .map((assignee) => profileMap.get(assignee.user_id))
    .filter((profile): profile is Profile => Boolean(profile));
  const assignableMembers = workspaceMembers.filter(
    (member) => !assigneeIds.has(member.user_id),
  );

  return (
    <AppShell workspaceId={post.workspace_id}>
      <main className="min-h-screen px-6 py-10 text-zinc-950">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link
                href={`/creatives/${post.campaign_id}`}
                aria-label="Back"
                className="inline-flex size-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-950"
              >
                <ArrowLeft className="size-4" />
              </Link>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight">
                  {post.title}
                </h1>
                <StatusBadge status={post.current_status} />
              </div>
              {post.description ? (
                <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">
                  {post.description}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <MemberAvatarGroup members={assigneeProfiles} />
              <form action={deleteCreativePost}>
                <input type="hidden" name="workspaceId" value={post.workspace_id} />
                <input type="hidden" name="campaignId" value={post.campaign_id} />
                <input type="hidden" name="postId" value={post.id} />
                <button
                  type="submit"
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 hover:bg-red-100"
                >
                  <Trash2 className="size-4" />
                  Delete
                </button>
              </form>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <section className="space-y-5">
              <Preview version={selectedVersion} />

              {selectedVersion ? (
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-zinc-950">
                        Version {selectedVersion.version_number}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Uploaded by{" "}
                        {displayName(profileMap.get(selectedVersion.uploaded_by))}
                        {" · "}
                        {selectedVersion.file_name}
                      </p>
                    </div>
                    <form action={approveCreativeVersion}>
                      <input type="hidden" name="workspaceId" value={post.workspace_id} />
                      <input type="hidden" name="campaignId" value={post.campaign_id} />
                      <input type="hidden" name="postId" value={post.id} />
                      <input type="hidden" name="versionId" value={selectedVersion.id} />
                      <button
                        disabled={selectedVersion.is_approved}
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <CheckCircle2 className="size-4" />
                        {selectedVersion.is_approved
                          ? "Approved version"
                          : "Mark approved"}
                      </button>
                    </form>
                  </div>
                  {selectedVersion.notes ? (
                    <p className="mt-4 rounded-xl bg-zinc-50 p-3 text-sm leading-6 text-zinc-700">
                      {selectedVersion.notes}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <VersionTimeline
                postId={post.id}
                versions={versions}
                selectedVersionId={selectedVersion?.id}
              />
            </section>

            <aside className="space-y-5">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold tracking-tight">
                  Creative details
                </h2>
                <form action={updateCreativeStatus} className="mt-4 space-y-3">
                  <input type="hidden" name="workspaceId" value={post.workspace_id} />
                  <input type="hidden" name="campaignId" value={post.campaign_id} />
                  <input type="hidden" name="postId" value={post.id} />
                  <label className="block text-sm font-medium text-zinc-700">
                    Status
                    <select
                      name="status"
                      defaultValue={post.current_status}
                      className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-950"
                    >
                      <option value="draft">Draft</option>
                      <option value="improvement_required">
                        Improvement Required
                      </option>
                      <option value="selected">Selected</option>
                      <option value="rejected">Rejected</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </label>
                  <button className="h-10 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800">
                    Update status
                  </button>
                </form>

                <div className="mt-5 border-t border-zinc-100 pt-5">
                  <p className="text-sm text-zinc-500">Owner</p>
                  <p className="mt-1 font-medium text-zinc-950">
                    {displayName(
                      post.owner_id ? profileMap.get(post.owner_id) : undefined,
                    )}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold tracking-tight">
                  Assignees
                </h2>
                <div className="mt-4 space-y-2">
                  {assignees.length ? (
                    assignees.map((assignee) => (
                      <div
                        key={assignee.user_id}
                        className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-zinc-800">
                          {displayName(profileMap.get(assignee.user_id))}
                        </span>
                        <form action={removeCreativeAssignee}>
                          <input type="hidden" name="workspaceId" value={post.workspace_id} />
                          <input type="hidden" name="campaignId" value={post.campaign_id} />
                          <input type="hidden" name="postId" value={post.id} />
                          <input type="hidden" name="userId" value={assignee.user_id} />
                          <button className="text-xs font-semibold text-zinc-500 hover:text-red-700">
                            Remove
                          </button>
                        </form>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">
                      No one is assigned yet.
                    </p>
                  )}
                </div>
                <form action={assignCreativePost} className="mt-3 flex gap-2">
                  <input type="hidden" name="workspaceId" value={post.workspace_id} />
                  <input type="hidden" name="campaignId" value={post.campaign_id} />
                  <input type="hidden" name="postId" value={post.id} />
                  <select
                    name="userId"
                    required
                    disabled={!assignableMembers.length}
                    className="h-10 min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">
                      {assignableMembers.length
                        ? "Assign member"
                        : "All members assigned"}
                    </option>
                    {assignableMembers.map((member) => {
                      const profile = profileMap.get(member.user_id);
                      return (
                        <option key={member.user_id} value={member.user_id}>
                          {displayName(profile)}
                        </option>
                      );
                    })}
                  </select>
                  <button
                    disabled={!assignableMembers.length}
                    className="h-10 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Assign
                  </button>
                </form>
              </div>

              <VersionUploader workspaceId={post.workspace_id} postId={post.id} />

              <CommentSection
                comments={comments}
                profilesById={profileMap}
                workspaceId={post.workspace_id}
                campaignId={post.campaign_id}
                postId={post.id}
                versionId={selectedVersion?.id}
              />

              <ActivityFeed activities={activities} profilesById={profileMap} />
            </aside>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
