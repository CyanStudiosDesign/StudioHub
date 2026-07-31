export type DocumentVisibility = "public" | "private" | "workspace";

export function isMissingDocumentVisibilityColumn(
  error: { code?: string; message?: string } | null | undefined,
) {
  return Boolean(
    error &&
      error.code === "42703" &&
      error.message?.toLowerCase().includes("visibility"),
  );
}
