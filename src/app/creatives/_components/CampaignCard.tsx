import Link from "next/link";
import { Archive, ArrowUpRight } from "lucide-react";
import type { CreativeCampaign, Profile } from "@/types/supabase";
import { archiveCampaign } from "../actions";
import MemberAvatarGroup from "./MemberAvatarGroup";
import StatusBadge from "./StatusBadge";

type CampaignCardProps = {
  campaign: CreativeCampaign;
  creativeCount: number;
  completedCount: number;
  members: Profile[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default function CampaignCard({
  campaign,
  creativeCount,
  completedCount,
  members,
}: CampaignCardProps) {
  const progress = creativeCount
    ? Math.round((completedCount / creativeCount) * 100)
    : 0;

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <StatusBadge status={campaign.status} />
          <h2 className="mt-4 text-xl font-semibold tracking-tight text-zinc-950">
            {campaign.title}
          </h2>
          {campaign.description ? (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-600">
              {campaign.description}
            </p>
          ) : null}
        </div>
        <Link
          href={`/creatives/${campaign.id}`}
          className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-950"
          aria-label={`Open ${campaign.title}`}
        >
          <ArrowUpRight className="size-4" />
        </Link>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-zinc-500">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-zinc-100">
          <div
            className="h-2 rounded-full bg-zinc-950"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-zinc-50 p-3">
          <p className="text-zinc-500">Creatives</p>
          <p className="mt-1 text-lg font-semibold text-zinc-950">
            {creativeCount}
          </p>
        </div>
        <div className="rounded-xl bg-zinc-50 p-3">
          <p className="text-zinc-500">Last updated</p>
          <p className="mt-1 font-semibold text-zinc-950">
            {formatDate(campaign.updated_at)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <MemberAvatarGroup members={members} />
        {campaign.status !== "archived" ? (
          <form action={archiveCampaign}>
            <input type="hidden" name="workspaceId" value={campaign.workspace_id} />
            <input type="hidden" name="campaignId" value={campaign.id} />
            <button
              type="submit"
              className="inline-flex size-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
              aria-label="Archive campaign"
            >
              <Archive className="size-4" />
            </button>
          </form>
        ) : null}
      </div>
    </article>
  );
}
