import Link from "next/link";
import type { CreativeCampaign, Profile } from "@/types/supabase";
import MemberAvatarGroup from "./MemberAvatarGroup";
import StatusBadge from "./StatusBadge";

type CampaignHeaderProps = {
  campaign: CreativeCampaign;
  creativeCount: number;
  completedCount: number;
  members: Profile[];
};

export default function CampaignHeader({
  campaign,
  creativeCount,
  completedCount,
  members,
}: CampaignHeaderProps) {
  const progress = creativeCount
    ? Math.round((completedCount / creativeCount) * 100)
    : 0;

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/creatives"
            className="text-sm font-medium text-zinc-500 hover:text-zinc-950"
          >
            Back to campaigns
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
              {campaign.title}
            </h1>
            <StatusBadge status={campaign.status} />
          </div>
          {campaign.description ? (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">
              {campaign.description}
            </p>
          ) : null}
        </div>
        <MemberAvatarGroup members={members} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-zinc-50 p-4">
          <p className="text-sm text-zinc-500">Progress</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">
            {progress}%
          </p>
        </div>
        <div className="rounded-2xl bg-zinc-50 p-4">
          <p className="text-sm text-zinc-500">Creatives</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">
            {creativeCount}
          </p>
        </div>
        <div className="rounded-2xl bg-zinc-50 p-4">
          <p className="text-sm text-zinc-500">Members involved</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">
            {members.length}
          </p>
        </div>
      </div>
    </section>
  );
}
