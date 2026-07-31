import { parseMarkdown } from "@/doc/markdown-renderer";
import { emojis as tiptapEmojis } from "@tiptap/extension-emoji";

export type TiptapMark = {
  type: "bold" | "italic" | "underline" | "strike" | "code" | "link";
  attrs?: Record<string, string>;
};

export type TiptapNode = {
  type: string;
  attrs?: Record<string, string | number | boolean | null>;
  content?: TiptapNode[];
  marks?: TiptapMark[];
  text?: string;
};

export type TiptapDocument = TiptapNode & {
  type: "doc";
  content: TiptapNode[];
};

export const emptyTiptapDocument: TiptapDocument = {
  type: "doc",
  content: [{ type: "heading", attrs: { level: 1 } }],
};

export function ensureTiptapTitle(
  document: TiptapDocument,
  fallbackTitle = "",
): TiptapDocument {
  const firstNode = document.content[0];
  if (firstNode?.type === "heading") {
    return {
      ...document,
      content: [
        { ...firstNode, attrs: { ...firstNode.attrs, level: 1 } },
        ...document.content.slice(1),
      ],
    };
  }

  const title = fallbackTitle.trim();
  const heading: TiptapNode = {
    type: "heading",
    attrs: { level: 1 },
    ...(title && title.toLowerCase() !== "untitled"
      ? { content: [{ type: "text", text: title }] }
      : {}),
  };

  return { type: "doc", content: [heading, ...document.content] };
}

const inlinePattern = /(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
const emojiByName = new Map(
  tiptapEmojis.map((item) => [item.name, item.emoji ?? `:${item.shortcodes[0] ?? item.name}:`]),
);

function safeHref(value: unknown) {
  if (typeof value !== "string") return "";

  const href = value.trim();
  if (/^(https?:|mailto:|tel:)/i.test(href) || href.startsWith("/") || href.startsWith("#")) {
    return href;
  }

  return "";
}

function safeMediaSource(value: unknown, kind: "image" | "audio" | "video") {
  if (typeof value !== "string") return "";
  const src = value.trim();
  if (/^https?:\/\//i.test(src) || src.startsWith("/")) return src;

  const dataTypes = {
    image: "(?:png|jpeg|gif|webp)",
    audio: "(?:mpeg|wav|ogg|mp4|webm)",
    video: "(?:mp4|webm|ogg)",
  };
  return new RegExp(`^data:${kind}/${dataTypes[kind]};base64,`, "i").test(src) ? src : "";
}

function inlineMarkdownToNodes(text: string): TiptapNode[] {
  const nodes: TiptapNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(inlinePattern)) {
    const index = match.index ?? 0;
    if (index > cursor) {
      nodes.push({ type: "text", text: text.slice(cursor, index) });
    }

    const value = match[0];
    if (value.startsWith("**")) {
      nodes.push({ type: "text", text: value.slice(2, -2), marks: [{ type: "bold" }] });
    } else if (value.startsWith("_")) {
      nodes.push({ type: "text", text: value.slice(1, -1), marks: [{ type: "italic" }] });
    } else if (value.startsWith("`")) {
      nodes.push({ type: "text", text: value.slice(1, -1), marks: [{ type: "code" }] });
    } else {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(value);
      const href = safeHref(link?.[2]);
      nodes.push({
        type: "text",
        text: link?.[1] ?? value,
        ...(href ? { marks: [{ type: "link", attrs: { href } }] } : {}),
      });
    }

    cursor = index + value.length;
  }

  if (cursor < text.length) {
    nodes.push({ type: "text", text: text.slice(cursor) });
  }

  return nodes;
}

function textBlock(
  type: string,
  text: string,
  attrs?: Record<string, string | number | boolean | null>,
): TiptapNode {
  const content = inlineMarkdownToNodes(text);
  return { type, ...(attrs ? { attrs } : {}), ...(content.length ? { content } : {}) };
}

export function markdownToTiptapDocument(markdown: string): TiptapDocument {
  const content = parseMarkdown(markdown).map<TiptapNode>((block) => {
    if (block.type === "heading") {
      return textBlock("heading", block.text, { level: Math.min(4, block.level) });
    }

    if (block.type === "list") {
      const isTaskList = !block.ordered && block.items.every((item) => /^\[[ x]\]\s*/i.test(item));
      if (isTaskList) {
        return {
          type: "taskList",
          content: block.items.map((item) => ({
            type: "taskItem",
            attrs: { checked: /^\[x\]/i.test(item) },
            content: [textBlock("paragraph", item.replace(/^\[[ x]\]\s*/i, ""))],
          })),
        };
      }
      return {
        type: block.ordered ? "orderedList" : "bulletList",
        content: block.items.map((item) => ({
          type: "listItem",
          content: [textBlock("paragraph", item)],
        })),
      };
    }

    if (block.type === "blockquote") {
      return { type: "blockquote", content: [textBlock("paragraph", block.text)] };
    }

    if (block.type === "code") {
      return { type: "codeBlock", content: block.code ? [{ type: "text", text: block.code }] : [] };
    }

    if (block.type === "divider") {
      return { type: "horizontalRule" };
    }

    return textBlock("paragraph", block.text);
  });

  return { type: "doc", content: content.length ? content : emptyTiptapDocument.content };
}

function sanitizeMarks(value: unknown): TiptapMark[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const marks = value.flatMap<TiptapMark>((item) => {
    if (!item || typeof item !== "object" || !("type" in item) || typeof item.type !== "string") {
      return [];
    }

    if (["bold", "italic", "underline", "strike", "code"].includes(item.type)) {
      return [{ type: item.type as TiptapMark["type"] }];
    }

    if (item.type === "link") {
      const attrs = "attrs" in item && item.attrs && typeof item.attrs === "object" ? item.attrs : {};
      const href = safeHref("href" in attrs ? attrs.href : "");
      return href ? [{ type: "link", attrs: { href } }] : [];
    }

    return [];
  });

  return marks.length ? marks : undefined;
}

const allowedChildren: Record<string, Set<string>> = {
  doc: new Set(["paragraph", "heading", "bulletList", "orderedList", "taskList", "blockquote", "codeBlock", "horizontalRule", "details", "image", "audio", "video", "youtube"]),
  paragraph: new Set(["text", "hardBreak", "emoji"]),
  heading: new Set(["text", "hardBreak", "emoji"]),
  bulletList: new Set(["listItem"]),
  orderedList: new Set(["listItem"]),
  taskList: new Set(["taskItem"]),
  listItem: new Set(["paragraph", "bulletList", "orderedList", "taskList", "blockquote"]),
  taskItem: new Set(["paragraph", "bulletList", "orderedList", "taskList", "blockquote"]),
  blockquote: new Set(["paragraph", "heading", "bulletList", "orderedList", "taskList", "blockquote", "codeBlock", "horizontalRule", "details", "image", "audio", "video", "youtube"]),
  details: new Set(["detailsSummary", "detailsContent"]),
  detailsSummary: new Set(["text", "hardBreak", "emoji"]),
  detailsContent: new Set(["paragraph", "heading", "bulletList", "orderedList", "taskList", "blockquote", "codeBlock", "horizontalRule", "details", "image", "audio", "video", "youtube"]),
  codeBlock: new Set(["text"]),
  horizontalRule: new Set(),
  hardBreak: new Set(),
  text: new Set(),
  emoji: new Set(),
  image: new Set(),
  audio: new Set(),
  video: new Set(),
  youtube: new Set(),
};

function sanitizeNode(value: unknown, depth = 0): TiptapNode | null {
  if (depth > 20 || !value || typeof value !== "object" || !("type" in value) || typeof value.type !== "string") {
    return null;
  }

  const nodeType = value.type;
  if (!(nodeType in allowedChildren)) return null;

  if (value.type === "text") {
    const text = "text" in value && typeof value.text === "string" ? value.text : "";
    const marks = "marks" in value ? sanitizeMarks(value.marks) : undefined;
    return { type: "text", text, ...(marks ? { marks } : {}) };
  }

  const attrs = "attrs" in value && value.attrs && typeof value.attrs === "object" ? value.attrs : {};

  if (value.type === "emoji") {
    const name = "name" in attrs && typeof attrs.name === "string" ? attrs.name.slice(0, 100) : "";
    return name ? { type: "emoji", attrs: { name } } : null;
  }

  if (value.type === "image") {
    const src = safeMediaSource("src" in attrs ? attrs.src : "", "image");
    if (!src) return null;
    const alt = "alt" in attrs && typeof attrs.alt === "string" ? attrs.alt.slice(0, 500) : "";
    const title = "title" in attrs && typeof attrs.title === "string" ? attrs.title.slice(0, 500) : "";
    const width = "width" in attrs && typeof attrs.width === "number" ? Math.max(50, Math.min(4000, attrs.width)) : null;
    const height = "height" in attrs && typeof attrs.height === "number" ? Math.max(50, Math.min(4000, attrs.height)) : null;
    return { type: "image", attrs: { src, alt, title, width, height } };
  }

  if (value.type === "audio" || value.type === "video") {
    const src = safeMediaSource("src" in attrs ? attrs.src : "", value.type);
    if (!src) return null;
    const title = "title" in attrs && typeof attrs.title === "string" ? attrs.title.slice(0, 500) : "";
    return { type: value.type, attrs: { src, title } };
  }

  if (value.type === "youtube") {
    const src = "src" in attrs && typeof attrs.src === "string" && /^https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\//i.test(attrs.src) ? attrs.src : "";
    if (!src) return null;
    const width = "width" in attrs && (typeof attrs.width === "number" || typeof attrs.width === "string") ? attrs.width : 720;
    const height = "height" in attrs && (typeof attrs.height === "number" || typeof attrs.height === "string") ? attrs.height : 405;
    return { type: "youtube", attrs: { src, width, height } };
  }

  const rawContent = "content" in value && Array.isArray(value.content) ? value.content : [];
  const content = rawContent.flatMap((child) => {
    const node = sanitizeNode(child, depth + 1);
    return node && allowedChildren[nodeType].has(node.type) ? [node] : [];
  });

  if (value.type === "heading") {
    const rawLevel = "level" in attrs && typeof attrs.level === "number" ? attrs.level : 2;
    return { type: "heading", attrs: { level: Math.max(1, Math.min(4, rawLevel)) }, ...(content.length ? { content } : {}) };
  }

  if (value.type === "orderedList") {
    if (!content.length) return null;
    const start = "start" in attrs && typeof attrs.start === "number" ? Math.max(1, attrs.start) : 1;
    return { type: value.type, attrs: { start }, ...(content.length ? { content } : {}) };
  }

  if (value.type === "listItem" && !content.length) {
    return { type: "listItem", content: [{ type: "paragraph" }] };
  }

  if (value.type === "taskItem") {
    const checked = "checked" in attrs && attrs.checked === true;
    return { type: "taskItem", attrs: { checked }, content: content.length ? content : [{ type: "paragraph" }] };
  }

  if (value.type === "details") {
    const summary = content.find((node) => node.type === "detailsSummary") ?? { type: "detailsSummary" };
    const detailsContent = content.find((node) => node.type === "detailsContent") ?? { type: "detailsContent", content: [{ type: "paragraph" }] };
    return { type: "details", attrs: { open: "open" in attrs && attrs.open === true }, content: [summary, detailsContent] };
  }

  if ((value.type === "bulletList" || value.type === "taskList") && !content.length) {
    return null;
  }

  return { type: value.type, ...(content.length ? { content } : {}) };
}

export function coerceTiptapDocument(value: unknown, legacyMarkdown = ""): TiptapDocument {
  const sanitized = sanitizeNode(value);
  if (sanitized?.type === "doc") {
    return {
      type: "doc",
      content: sanitized.content?.length ? sanitized.content : emptyTiptapDocument.content,
    };
  }

  return markdownToTiptapDocument(legacyMarkdown);
}

function escapeMarkdown(text: string) {
  return text.replace(/([\\`*_[\]])/g, "\\$1");
}

function markedTextToMarkdown(node: TiptapNode) {
  let text = escapeMarkdown(node.text ?? "");

  for (const mark of node.marks ?? []) {
    if (mark.type === "bold") text = `**${text}**`;
    if (mark.type === "italic") text = `_${text}_`;
    if (mark.type === "underline") text = `<u>${text}</u>`;
    if (mark.type === "strike") text = `~~${text}~~`;
    if (mark.type === "code") text = `\`${node.text ?? ""}\``;
    if (mark.type === "link" && mark.attrs?.href) text = `[${text}](${mark.attrs.href})`;
  }

  return text;
}

function inlineContentToMarkdown(node: TiptapNode): string {
  return (node.content ?? []).map((child) => {
    if (child.type === "text") return markedTextToMarkdown(child);
    if (child.type === "hardBreak") return "  \n";
    if (child.type === "emoji") return emojiByName.get(String(child.attrs?.name)) ?? `:${child.attrs?.name ?? "emoji"}:`;
    return inlineContentToMarkdown(child);
  }).join("");
}

function nodeToMarkdown(node: TiptapNode, depth = 0): string {
  if (node.type === "paragraph") return inlineContentToMarkdown(node);
  if (node.type === "heading") return `${"#".repeat(Number(node.attrs?.level) || 2)} ${inlineContentToMarkdown(node)}`;
  if (node.type === "horizontalRule") return "---";
  if (node.type === "image") return `![${String(node.attrs?.alt ?? "image")}](${String(node.attrs?.src ?? "")}${node.attrs?.title ? ` \"${String(node.attrs.title).replace(/\"/g, "\\\"")}\"` : ""})`;
  if (node.type === "audio") return `<audio controls src="${String(node.attrs?.src ?? "")}"></audio>`;
  if (node.type === "video") return `<video controls src="${String(node.attrs?.src ?? "")}"></video>`;
  if (node.type === "youtube") return `[Watch video](${String(node.attrs?.src ?? "")})`;
  if (node.type === "codeBlock") return `\`\`\`\n${(node.content ?? []).map((child) => child.text ?? "").join("")}\n\`\`\``;
  if (node.type === "blockquote") {
    return (node.content ?? []).map((child) => nodeToMarkdown(child, depth)).join("\n").split("\n").map((line) => `> ${line}`).join("\n");
  }
  if (node.type === "bulletList" || node.type === "orderedList") {
    const start = Number(node.attrs?.start) || 1;
    return (node.content ?? []).map((item, index) => {
      const prefix = node.type === "orderedList" ? `${start + index}. ` : "- ";
      const value = (item.content ?? []).map((child) => nodeToMarkdown(child, depth + 1)).join("\n");
      return `${"  ".repeat(depth)}${prefix}${value}`;
    }).join("\n");
  }
  if (node.type === "taskList") {
    return (node.content ?? []).map((item) => {
      const checked = item.attrs?.checked === true ? "x" : " ";
      const value = (item.content ?? []).map((child) => nodeToMarkdown(child, depth + 1)).join("\n");
      return `${"  ".repeat(depth)}- [${checked}] ${value}`;
    }).join("\n");
  }
  if (node.type === "details") {
    const summary = node.content?.find((child) => child.type === "detailsSummary");
    const detailsContent = node.content?.find((child) => child.type === "detailsContent");
    const body = (detailsContent?.content ?? []).map((child) => nodeToMarkdown(child, depth)).join("\n\n");
    return `<details>\n<summary>${summary ? inlineContentToMarkdown(summary) : "Details"}</summary>\n\n${body}\n\n</details>`;
  }
  if (node.type === "detailsContent") return (node.content ?? []).map((child) => nodeToMarkdown(child, depth)).join("\n\n");
  if (node.type === "detailsSummary") return inlineContentToMarkdown(node);
  if (node.type === "listItem") return (node.content ?? []).map((child) => nodeToMarkdown(child, depth)).join("\n");
  return inlineContentToMarkdown(node);
}

export function tiptapDocumentToMarkdown(document: TiptapDocument) {
  return document.content.map((node) => nodeToMarkdown(node)).join("\n\n").trim();
}

export function tiptapDocumentText(document: TiptapDocument) {
  const values: string[] = [];
  const visit = (node: TiptapNode) => {
    if (node.type === "text" && node.text) values.push(node.text);
    node.content?.forEach(visit);
  };
  visit(document);
  return values.join(" ").replace(/\s+/g, " ").trim();
}

export function getTiptapDocumentTitle(document: TiptapDocument) {
  const heading = document.content.find((node) => node.type === "heading");
  const title = (heading ? inlineContentToMarkdown(heading) : tiptapDocumentText(document))
    .replace(/[*_`~\[\]]/g, "")
    .trim();
  return title.slice(0, 180) || "untitled";
}
