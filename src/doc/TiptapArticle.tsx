import React from "react";
import { emojis } from "@tiptap/extension-emoji";
import { getEmbedUrlFromYoutubeUrl } from "@tiptap/extension-youtube";
import { coerceTiptapDocument, type TiptapNode } from "@/lib/tiptap-document";

const emojiByName = new Map(
  emojis.map((item) => [item.name, item.emoji ?? `:${item.shortcodes[0] ?? item.name}:`]),
);

function renderMarkedText(node: TiptapNode, key: React.Key) {
  let content: React.ReactNode = node.text ?? "";

  for (const mark of node.marks ?? []) {
    if (mark.type === "bold") content = <strong>{content}</strong>;
    if (mark.type === "italic") content = <em>{content}</em>;
    if (mark.type === "underline") content = <u>{content}</u>;
    if (mark.type === "strike") content = <s>{content}</s>;
    if (mark.type === "code") content = <code>{content}</code>;
    if (mark.type === "link") {
      content = (
        <a href={mark.attrs?.href} rel="noopener noreferrer nofollow" target="_blank">
          {content}
        </a>
      );
    }
  }

  return <React.Fragment key={key}>{content}</React.Fragment>;
}

function renderChildren(node: TiptapNode) {
  return node.content?.map((child, index) => renderNode(child, index));
}

function renderNode(node: TiptapNode, key: React.Key): React.ReactNode {
  if (node.type === "text") return renderMarkedText(node, key);
  if (node.type === "hardBreak") return <br key={key} />;
  if (node.type === "emoji") {
    return <React.Fragment key={key}>{emojiByName.get(String(node.attrs?.name)) ?? "🙂"}</React.Fragment>;
  }
  if (node.type === "paragraph") return <p key={key}>{renderChildren(node)}</p>;
  if (node.type === "heading") {
    const level = Math.max(1, Math.min(4, Number(node.attrs?.level) || 2));
    return React.createElement(`h${level}`, { key }, renderChildren(node));
  }
  if (node.type === "bulletList") return <ul key={key}>{renderChildren(node)}</ul>;
  if (node.type === "orderedList") {
    return <ol key={key} start={Number(node.attrs?.start) || 1}>{renderChildren(node)}</ol>;
  }
  if (node.type === "listItem") return <li key={key}>{renderChildren(node)}</li>;
  if (node.type === "taskList") return <ul key={key} data-type="taskList">{renderChildren(node)}</ul>;
  if (node.type === "taskItem") {
    return (
      <li key={key} data-type="taskItem" data-checked={node.attrs?.checked === true}>
        <label><input type="checkbox" checked={node.attrs?.checked === true} readOnly /><span /></label>
        <div>{renderChildren(node)}</div>
      </li>
    );
  }
  if (node.type === "blockquote") return <blockquote key={key}>{renderChildren(node)}</blockquote>;
  if (node.type === "codeBlock") {
    const code = (node.content ?? []).map((child) => child.text ?? "").join("");
    return <pre key={key}><code>{code}</code></pre>;
  }
  if (node.type === "horizontalRule") return <hr key={key} />;
  if (node.type === "details") return <details key={key} open={node.attrs?.open === true}>{renderChildren(node)}</details>;
  if (node.type === "detailsSummary") return <summary key={key}>{renderChildren(node)}</summary>;
  if (node.type === "detailsContent") return <div key={key} data-type="detailsContent">{renderChildren(node)}</div>;
  if (node.type === "image") {
    return (
      // The source is user-authored document content and is sanitized before rendering.
      // eslint-disable-next-line @next/next/no-img-element
      <img key={key} src={String(node.attrs?.src ?? "")} alt={String(node.attrs?.alt ?? "")} title={String(node.attrs?.title ?? "")} />
    );
  }
  if (node.type === "audio") return <audio key={key} src={String(node.attrs?.src ?? "")} controls preload="metadata" />;
  if (node.type === "video") return <video key={key} src={String(node.attrs?.src ?? "")} controls preload="metadata" />;
  if (node.type === "youtube") {
    const src = getEmbedUrlFromYoutubeUrl({ url: String(node.attrs?.src ?? ""), nocookie: true });
    return src ? (
      <iframe
        key={key}
        src={src}
        title="Embedded YouTube video"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    ) : null;
  }

  return <React.Fragment key={key}>{renderChildren(node)}</React.Fragment>;
}

export function TiptapArticle({
  content,
  hideTitle = false,
}: {
  content: unknown;
  hideTitle?: boolean;
}) {
  const document = coerceTiptapDocument(content);
  const articleContent = hideTitle && document.content[0]?.type === "heading"
    ? document.content.slice(1)
    : document.content;

  return (
    <article className="tiptap-article mx-auto my-14 max-w-3xl px-6 lg:px-0">
      {articleContent.map((node, index) => renderNode(node, index))}
    </article>
  );
}
