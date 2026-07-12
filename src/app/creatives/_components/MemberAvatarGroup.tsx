type Member = {
  id: string;
  full_name?: string | null;
  username?: string | null;
  email?: string | null;
};

function initials(member: Member) {
  const name = member.full_name || member.username || member.email || "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function MemberAvatarGroup({
  members,
  limit = 4,
}: {
  members: Member[];
  limit?: number;
}) {
  const visible = members.slice(0, limit);
  const hiddenCount = Math.max(members.length - visible.length, 0);

  if (!members.length) {
    return <span className="text-xs text-zinc-400">No members</span>;
  }

  return (
    <div className="flex items-center">
      {visible.map((member) => (
        <div
          key={member.id}
          title={member.full_name || member.username || member.email || "Member"}
          className="-ml-2 first:ml-0 flex size-8 items-center justify-center rounded-full border-2 border-white bg-zinc-950 text-[11px] font-semibold text-white shadow-sm"
        >
          {initials(member)}
        </div>
      ))}
      {hiddenCount ? (
        <div className="-ml-2 flex size-8 items-center justify-center rounded-full border-2 border-white bg-zinc-100 text-[11px] font-semibold text-zinc-600">
          +{hiddenCount}
        </div>
      ) : null}
    </div>
  );
}
