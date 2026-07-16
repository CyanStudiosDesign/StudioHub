export default function ProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className="h-2 rounded-full bg-zinc-100">
      <div
        className="h-2 rounded-full bg-zinc-950 transition-all"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
