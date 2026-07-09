import React from "react";

export type MarkdownBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "blockquote"; text: string }
  | { type: "code"; code: string }
  | { type: "divider" };

type InlineToken =
  | { type: "text"; value: string }
  | { type: "strong"; value: string }
  | { type: "em"; value: string }
  | { type: "code"; value: string }
  | { type: "link"; label: string; href: string };

export function parseMarkdown(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }

      blocks.push({ type: "code", code: codeLines.join("\n") });
      index += 1;
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      blocks.push({ type: "divider" });
      index += 1;
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(trimmed);
    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1].length,
        text: heading[2],
      });
      index += 1;
      continue;
    }

    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];

      while (index < lines.length && lines[index].trim().startsWith(">")) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }

      blocks.push({ type: "blockquote", text: quoteLines.join(" ") });
      continue;
    }

    if (/^[-*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      const ordered = /^\d+\.\s+/.test(trimmed);
      const items: string[] = [];

      while (index < lines.length) {
        const item = lines[index].trim();
        const matchesListType = ordered
          ? /^\d+\.\s+/.test(item)
          : /^[-*]\s+/.test(item);

        if (!matchesListType) {
          break;
        }

        items.push(item.replace(ordered ? /^\d+\.\s+/ : /^[-*]\s+/, ""));
        index += 1;
      }

      blocks.push({ type: "list", ordered, items });
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length) {
      const current = lines[index].trim();
      const startsNextBlock =
        !current ||
        current.startsWith("```") ||
        current.startsWith(">") ||
        /^---+$/.test(current) ||
        /^(#{1,6})\s+/.test(current) ||
        /^[-*]\s+/.test(current) ||
        /^\d+\.\s+/.test(current);

      if (startsNextBlock) {
        break;
      }

      paragraphLines.push(current);
      index += 1;
    }

    blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
  }

  return blocks;
}

function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const pattern =
    /(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      tokens.push({ type: "text", value: text.slice(cursor, match.index) });
    }

    const value = match[0];

    if (value.startsWith("**")) {
      tokens.push({ type: "strong", value: value.slice(2, -2) });
    } else if (value.startsWith("_")) {
      tokens.push({ type: "em", value: value.slice(1, -1) });
    } else if (value.startsWith("`")) {
      tokens.push({ type: "code", value: value.slice(1, -1) });
    } else {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(value);
      if (link) {
        tokens.push({ type: "link", label: link[1], href: link[2] });
      }
    }

    cursor = match.index + value.length;
  }

  if (cursor < text.length) {
    tokens.push({ type: "text", value: text.slice(cursor) });
  }

  return tokens;
}

export function InlineMarkdown({ text }: { text: string }) {
  return parseInline(text).map((token, index) => {
    if (token.type === "strong") {
      return (
        <strong key={index} className="font-semibold text-zinc-900">
          {token.value}
        </strong>
      );
    }

    if (token.type === "em") {
      return <em key={index}>{token.value}</em>;
    }

    if (token.type === "code") {
      return (
        <code
          key={index}
          className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm text-zinc-900"
        >
          {token.value}
        </code>
      );
    }

    if (token.type === "link") {
      return (
        <a
          key={index}
          href={token.href}
          className="font-medium text-zinc-950 underline decoration-zinc-300 underline-offset-4 hover:decoration-zinc-900"
        >
          {token.label}
        </a>
      );
    }

    return <React.Fragment key={index}>{token.value}</React.Fragment>;
  });
}

function SectionHeading({
  block,
}: {
  block: Extract<MarkdownBlock, { type: "heading" }>;
}) {
  const className =
    block.level === 2
      ? "text-3xl font-semibold mb-4 tracking-tight"
      : "text-2xl font-semibold mb-4 tracking-tight";

  if (block.level === 2) {
    return (
      <h2 className={className}>
        <InlineMarkdown text={block.text} />
      </h2>
    );
  }

  return (
    <h3 className={className}>
      <InlineMarkdown text={block.text} />
    </h3>
  );
}

function BlogBlock({ block }: { block: MarkdownBlock }) {
  if (block.type === "heading") {
    return <SectionHeading block={block} />;
  }

  if (block.type === "paragraph") {
    return (
      <p className="text-zinc-700 text-lg leading-relaxed mb-4">
        <InlineMarkdown text={block.text} />
      </p>
    );
  }

  if (block.type === "list") {
    const ListTag = block.ordered ? "ol" : "ul";
    const listStyle = block.ordered ? "list-decimal" : "list-disc";

    return (
      <ListTag className={`${listStyle} ml-6 space-y-3 text-zinc-700 text-lg`}>
        {block.items.map((item, index) => (
          <li key={index}>
            <InlineMarkdown text={item} />
          </li>
        ))}
      </ListTag>
    );
  }

  if (block.type === "blockquote") {
    return (
      <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-100">
        <p className="text-zinc-600 text-base leading-relaxed">
          <InlineMarkdown text={block.text} />
        </p>
      </div>
    );
  }

  if (block.type === "code") {
    return (
      <pre className="overflow-x-auto rounded-xl border border-zinc-100 bg-zinc-950 p-6 text-sm leading-7 text-zinc-100">
        <code>{block.code}</code>
      </pre>
    );
  }

  return <hr className="border-zinc-200" />;
}

function splitIntoSections(blocks: MarkdownBlock[]) {
  const sections: MarkdownBlock[][] = [];

  for (const block of blocks) {
    if (block.type === "heading" && block.level === 2) {
      sections.push([block]);
      continue;
    }

    if (!sections.length) {
      sections.push([]);
    }

    sections[sections.length - 1].push(block);
  }

  return sections.filter((section) => section.length);
}

export function MarkdownArticle({ markdown }: { markdown: string }) {
  const blocks = parseMarkdown(markdown);
  const titleBlock =
    blocks[0]?.type === "heading" && blocks[0].level === 1 ? blocks[0] : null;
  const leadBlock = blocks.find((block) => block.type === "paragraph");
  const contentBlocks = blocks.filter(
    (block) => block !== titleBlock && block !== leadBlock,
  );
  const sections = splitIntoSections(contentBlocks);

  return (
    <div className="font-sans text-zinc-900 max-w-3xl mx-auto my-16 px-6 lg:px-0">
      <header className="mb-10">
        <h1 className="text-5xl font-medium tracking-tight mb-4 flex items-start">
          {titleBlock ? <InlineMarkdown text={titleBlock.text} /> : "Blog"}
        </h1>
        {leadBlock?.type === "paragraph" ? (
          <p className="text-zinc-600 text-xl leading-relaxed font-normal">
            <InlineMarkdown text={leadBlock.text} />
          </p>
        ) : null}
      </header>

      <section className="space-y-10">
        {sections.map((section, sectionIndex) => (
          <div
            key={sectionIndex}
            className={
              sectionIndex === 0 ? undefined : "pt-10 border-t border-zinc-200"
            }
          >
            <div className="space-y-6">
              {section.map((block, blockIndex) => (
                <BlogBlock key={blockIndex} block={block} />
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
