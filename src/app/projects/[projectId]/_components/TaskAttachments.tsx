"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ProjectAttachment } from "@/types/supabase";
import { createClient } from "@/utils/supabase/client";

const acceptedTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "video/mp4",
  "video/quicktime",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
].join(",");

function cleanFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

export default function TaskAttachments({
  projectId,
  taskId,
  attachments,
}: {
  projectId: string;
  taskId: string;
  attachments: ProjectAttachment[];
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isPending, startTransition] = useTransition();

  async function upload() {
    if (!file) return;
    setError(null);
    setProgress(20);

    const supabase = createClient();
    const storagePath = `${projectId}/${taskId}/${crypto.randomUUID()}-${cleanFileName(
      file.name,
    )}`;
    const { error: uploadError } = await supabase.storage
      .from("project-attachments")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      setError(uploadError.message);
      setProgress(0);
      return;
    }

    setProgress(70);
    const { data } = supabase.storage
      .from("project-attachments")
      .getPublicUrl(storagePath);
    const response = await fetch(`/api/projects/tasks/${taskId}/attachments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        storagePath,
        previewUrl: data.publicUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      }),
    });
    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(result.error ?? "Unable to save attachment.");
      setProgress(0);
      return;
    }

    setProgress(100);
    setFile(null);
    startTransition(() => router.refresh());
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight">Attachments</h2>
      <div className="mt-4 space-y-2">
        {attachments.length ? (
          attachments.map((attachment) => (
            <a
              key={attachment.id}
              href={attachment.preview_url ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="block rounded-xl bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-950"
            >
              {attachment.file_name}
            </a>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">
            No attachments yet.
          </p>
        )}
      </div>
      <div className="mt-4 space-y-3">
        <input
          type="file"
          accept={acceptedTypes}
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="block w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
        />
        {progress ? (
          <div className="h-2 rounded-full bg-zinc-100">
            <div
              className="h-2 rounded-full bg-zinc-950"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button
          type="button"
          disabled={!file || isPending || (progress > 0 && progress < 100)}
          onClick={upload}
          className="h-10 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Upload attachment
        </button>
      </div>
    </section>
  );
}
