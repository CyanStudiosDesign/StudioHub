"use client";

import { UploadCloud } from "lucide-react";

const acceptedTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "application/pdf",
].join(",");

export default function UploadDropzone({
  disabled,
  fileName,
  onFileChange,
}: {
  disabled?: boolean;
  fileName?: string;
  onFileChange: (file: File | null) => void;
}) {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-5 py-8 text-center transition hover:border-zinc-400 hover:bg-white has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
      <UploadCloud className="size-8 text-zinc-500" />
      <span className="mt-3 text-sm font-semibold text-zinc-950">
        {fileName || "Drop or choose a creative file"}
      </span>
      <span className="mt-1 text-xs text-zinc-500">
        PNG, JPG, WEBP, MP4, MOV, or PDF
      </span>
      <input
        type="file"
        accept={acceptedTypes}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
      />
    </label>
  );
}
