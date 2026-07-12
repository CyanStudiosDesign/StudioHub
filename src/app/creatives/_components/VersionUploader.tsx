"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import UploadDropzone from "./UploadDropzone";

type VersionUploaderProps = {
  workspaceId: string;
  postId: string;
};

const allowedMimeTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "application/pdf",
]);

function cleanFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

export default function VersionUploader({
  workspaceId,
  postId,
}: VersionUploaderProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isPending, startTransition] = useTransition();

  async function uploadVersion() {
    if (!file) {
      setError("Choose a file before uploading.");
      return;
    }

    if (!allowedMimeTypes.has(file.type)) {
      setError("This file type is not supported.");
      return;
    }

    setError(null);
    setProgress(12);

    const supabase = createClient();
    const storagePath = `${workspaceId}/${postId}/${crypto.randomUUID()}-${cleanFileName(
      file.name,
    )}`;

    setProgress(35);
    const { error: uploadError } = await supabase.storage
      .from("creative-assets")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      setProgress(0);
      setError(uploadError.message);
      return;
    }

    setProgress(72);
    const { data } = supabase.storage
      .from("creative-assets")
      .getPublicUrl(storagePath);

    const response = await fetch(`/api/creatives/posts/${postId}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storagePath,
        previewUrl: data.publicUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        notes,
      }),
    });

    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setProgress(0);
      setError(result.error ?? "Unable to save this version.");
      return;
    }

    setProgress(100);
    setFile(null);
    setNotes("");
    startTransition(() => router.refresh());
  }

  const busy = progress > 0 && progress < 100;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
        Upload new version
      </h2>
      <div className="mt-4 space-y-4">
        <UploadDropzone
          disabled={busy || isPending}
          fileName={file?.name}
          onFileChange={setFile}
        />
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Version notes"
          className="min-h-24 w-full resize-none rounded-xl border border-zinc-200 px-3 py-3 text-sm outline-none focus:border-zinc-950"
        />
        {progress ? (
          <div>
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-zinc-500">
              <span>{progress === 100 ? "Saved" : "Uploading"}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-100">
              <div
                className="h-2 rounded-full bg-zinc-950 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : null}
        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          onClick={uploadVersion}
          disabled={!file || busy || isPending}
          className="h-11 w-full rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save version
        </button>
      </div>
    </div>
  );
}
