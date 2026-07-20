type DocumentPathSource = {
  id: string;
  title: string;
};

const uuidPattern =
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

export function createDocumentSlug(title: string) {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

  return slug || "untitled";
}

export function createDocumentSlugId(document: DocumentPathSource) {
  return `${createDocumentSlug(document.title)}-${document.id}`;
}

export function getDocumentHref(document: DocumentPathSource) {
  return `/docs/${createDocumentSlugId(document)}`;
}

export function getDocumentIdFromSlugId(slugId: string) {
  return uuidPattern.exec(slugId)?.[0] ?? slugId;
}

