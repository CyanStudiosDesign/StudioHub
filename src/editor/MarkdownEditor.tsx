"use client";

import {
  ClipboardEvent,
  FormEvent,
  KeyboardEvent,
  PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MarkdownBlock, parseMarkdown } from "@/doc/markdown-renderer";

type BlockType =
  | "title"
  | "heading2"
  | "heading3"
  | "paragraph"
  | "bullet"
  | "quote"
  | "code"
  | "divider";

type EditorBlock = {
  id: string;
  type: BlockType;
  text: string;
};

type Command = {
  type: BlockType;
  label: string;
  hint: string;
  shortcut: string;
  group: "Basic" | "Blocks";
};

const storageKey = "studio-hub-markdown-editor-v2";

const commands: Command[] = [
  {
    type: "paragraph",
    label: "Text",
    hint: "Plain paragraph",
    shortcut: "text",
    group: "Basic",
  },
  {
    type: "title",
    label: "Heading 1",
    hint: "Large page title",
    shortcut: "#",
    group: "Basic",
  },
  {
    type: "heading2",
    label: "Heading 2",
    hint: "Section heading",
    shortcut: "##",
    group: "Basic",
  },
  {
    type: "heading3",
    label: "Heading 3",
    hint: "Small heading",
    shortcut: "###",
    group: "Basic",
  },
  {
    type: "bullet",
    label: "Bulleted list",
    hint: "Simple list item",
    shortcut: "-",
    group: "Blocks",
  },
  {
    type: "quote",
    label: "Quote",
    hint: "Callout or quote",
    shortcut: ">",
    group: "Blocks",
  },
  {
    type: "code",
    label: "Code",
    hint: "Code block",
    shortcut: "```",
    group: "Blocks",
  },
  {
    type: "divider",
    label: "Divider",
    hint: "Horizontal rule",
    shortcut: "---",
    group: "Blocks",
  },
];

const starterBlocks: EditorBlock[] = [
  {
    id: "block-empty",
    type: "paragraph",
    text: "",
  },
];

function createBlock(type: BlockType = "paragraph", text = ""): EditorBlock {
  return {
    id: crypto.randomUUID(),
    type,
    text,
  };
}

function detectBlock(text: string, currentType: BlockType) {
  const conversions: Array<[RegExp, BlockType]> = [
    [/^###\s+/, "heading3"],
    [/^##\s+/, "heading2"],
    [/^#\s+/, "title"],
    [/^[-*]\s+/, "bullet"],
    [/^>\s+/, "quote"],
    [/^```\s*/, "code"],
    [/^---+$/, "divider"],
  ];

  for (const [pattern, type] of conversions) {
    if (pattern.test(text)) {
      return {
        type,
        text: type === "divider" ? "" : text.replace(pattern, ""),
      };
    }
  }

  return { type: currentType, text };
}

function blockToMarkdown(block: EditorBlock) {
  if (block.type === "title") {
    return `# ${block.text}`;
  }

  if (block.type === "heading2") {
    return `## ${block.text}`;
  }

  if (block.type === "heading3") {
    return `### ${block.text}`;
  }

  if (block.type === "bullet") {
    return `- ${block.text}`;
  }

  if (block.type === "quote") {
    return `> ${block.text}`;
  }

  if (block.type === "code") {
    return `\`\`\`\n${block.text}\n\`\`\``;
  }

  if (block.type === "divider") {
    return "---";
  }

  return block.text;
}

function blocksToMarkdown(blocks: EditorBlock[]) {
  return blocks.map(blockToMarkdown).join("\n\n");
}

function markdownBlockToEditorBlocks(block: MarkdownBlock): EditorBlock[] {
  if (block.type === "heading") {
    if (block.level === 1) {
      return [createBlock("title", block.text)];
    }

    if (block.level === 2) {
      return [createBlock("heading2", block.text)];
    }

    return [createBlock("heading3", block.text)];
  }

  if (block.type === "list") {
    return block.items.map((item) => createBlock("bullet", item));
  }

  if (block.type === "blockquote") {
    return [createBlock("quote", block.text)];
  }

  if (block.type === "code") {
    return [createBlock("code", block.code)];
  }

  if (block.type === "divider") {
    return [createBlock("divider")];
  }

  return [createBlock("paragraph", block.text)];
}

function markdownToEditorBlocks(markdown: string) {
  const parsedBlocks = parseMarkdown(markdown);
  const editorBlocks = parsedBlocks.flatMap(markdownBlockToEditorBlocks);

  if (editorBlocks.length) {
    return editorBlocks;
  }

  return [createBlock("paragraph", markdown.trim())];
}

function getBlockClass(type: BlockType) {
  const shared =
    "min-h-8 w-full min-w-0 whitespace-pre-wrap break-words rounded-md px-1 py-1 outline-none transition-colors [overflow-wrap:anywhere]";

  if (type === "title") {
    return `${shared} text-5xl font-semibold tracking-tight text-zinc-950 md:text-6xl`;
  }

  if (type === "heading2") {
    return `${shared} text-4xl font-semibold tracking-tight text-zinc-950 md:text-5xl`;
  }

  if (type === "heading3") {
    return `${shared} text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl`;
  }

  if (type === "bullet") {
    return `${shared} text-lg leading-relaxed text-zinc-700 md:text-xl`;
  }

  if (type === "quote") {
    return `${shared} border-l-4 border-zinc-300 bg-zinc-50 pl-5 text-lg leading-relaxed text-zinc-600 md:text-xl`;
  }

  if (type === "code") {
    return `${shared} whitespace-pre-wrap bg-zinc-950 p-4 font-mono text-sm leading-7 text-zinc-100 focus:bg-zinc-950`;
  }

  return `${shared} text-lg leading-relaxed text-zinc-700 md:text-xl`;
}

function labelFor(type: BlockType) {
  if (type === "title") return "H1";
  if (type === "heading2") return "H2";
  if (type === "heading3") return "H3";
  if (type === "bullet") return "List";
  if (type === "quote") return "Quote";
  if (type === "code") return "Code";
  if (type === "divider") return "Rule";
  return "Text";
}

export default function MarkdownEditor() {
  const [blocks, setBlocks] = useState<EditorBlock[]>(starterBlocks);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [commandBlockId, setCommandBlockId] = useState<string | null>(null);
  const [commandQuery, setCommandQuery] = useState("");
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [currentBlockId, setCurrentBlockId] = useState(starterBlocks[0].id);
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const editorRootRef = useRef<HTMLDivElement | null>(null);
  const commandInputRef = useRef<HTMLInputElement | null>(null);
  const storageLoaded = useRef(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const saved = window.localStorage.getItem(storageKey);

      if (saved) {
        try {
          const parsed = JSON.parse(saved) as EditorBlock[];
          if (Array.isArray(parsed) && parsed.length) {
            setBlocks(parsed);
          }
        } catch {
          window.localStorage.removeItem(storageKey);
        }
      }

      storageLoaded.current = true;
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!storageLoaded.current) return;

    window.localStorage.setItem(storageKey, JSON.stringify(blocks));
  }, [blocks]);

  useEffect(() => {
    if (!focusId) return;

    const node = refs.current[focusId];
    if (!node) return;

    editorRootRef.current?.focus();
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [blocks, focusId]);

  useEffect(() => {
    if (!commandBlockId) return;

    commandInputRef.current?.focus();
  }, [commandBlockId]);

  const markdown = useMemo(() => blocksToMarkdown(blocks), [blocks]);
  const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(words / 180));
  const filteredCommands = commands.filter((command) => {
    const query = commandQuery.toLowerCase();

    return (
      command.label.toLowerCase().includes(query) ||
      command.hint.toLowerCase().includes(query) ||
      command.shortcut.includes(query)
    );
  });
  const groupedCommands = filteredCommands.reduce<Record<Command["group"], Command[]>>(
    (groups, command) => {
      groups[command.group].push(command);
      return groups;
    },
    { Basic: [], Blocks: [] },
  );

  function openCommandMenu(id: string) {
    setCommandBlockId(id);
    setCommandQuery("");
    setSelectedCommandIndex(0);
  }

  function moveCaretToEnd(node: HTMLDivElement) {
    editorRootRef.current?.focus();
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  function syncEditableNode(node: HTMLDivElement | null, block: EditorBlock) {
    refs.current[block.id] = node;

    if (!node) return;

    if (node.textContent !== block.text) {
      node.textContent = block.text;
    }
  }

  function getEventBlock(target: EventTarget | null) {
    const element =
      target instanceof HTMLElement
        ? target
        : target instanceof Node
          ? target.parentElement
          : null;

    const selection = window.getSelection();
    const selectionElement =
      selection?.anchorNode instanceof HTMLElement
        ? selection.anchorNode
        : selection?.anchorNode?.parentElement;
    const lookupElement = element ?? selectionElement;

    if (!lookupElement) return null;

    const blockNode =
      lookupElement.closest<HTMLElement>("[data-block-id]") ??
      selectionElement?.closest<HTMLElement>("[data-block-id]");
    const blockId = blockNode?.dataset.blockId;
    const block = blocks.find((item) => item.id === blockId);

    if (!blockNode || !block) return null;

    return {
      block,
      node: blockNode as HTMLDivElement,
    };
  }

  function getSelectedBlockIds() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return [];

    const range = selection.getRangeAt(0);
    const selectedIds = blocks
      .filter((block) => {
        const node = refs.current[block.id];
        return node ? range.intersectsNode(node) : false;
      })
      .map((block) => block.id);

    return selectedIds;
  }

  function copySelectedBlocks() {
    const selectedIds = getSelectedBlockIds();
    if (selectedIds.length < 2) return false;

    const selectedMarkdown = blocks
      .filter((block) => selectedIds.includes(block.id))
      .map(blockToMarkdown)
      .join("\n\n");

    void navigator.clipboard.writeText(selectedMarkdown);
    return true;
  }

  function deleteSelectedBlocks() {
    const selectedIds = getSelectedBlockIds();
    if (selectedIds.length < 2) return false;

    setBlocks((current) => {
      const firstIndex = current.findIndex((block) => block.id === selectedIds[0]);
      const next = current.filter((block) => !selectedIds.includes(block.id));

      if (!next.length) {
        const emptyBlock = createBlock();
        setFocusId(emptyBlock.id);
        return [emptyBlock];
      }

      const focusBlock = next[Math.max(0, Math.min(firstIndex, next.length - 1))];
      setFocusId(focusBlock.id);
      return next;
    });

    window.getSelection()?.removeAllRanges();
    return true;
  }

  function updateBlock(id: string, rawText: string, sourceNode: HTMLDivElement) {
    let transformedText: string | null = null;

    setBlocks((current) =>
      current.map((block) => {
        if (block.id !== id) return block;

        if (!rawText.trim()) {
          if (block.type !== "paragraph") {
            setFocusId(id);
          }

          return { ...block, type: "paragraph", text: "" };
        }

        const next = detectBlock(rawText, block.type);
        if (next.type !== block.type) {
          setFocusId(id);
        }

        if (next.text !== rawText) {
          transformedText = next.text;
        }

        return { ...block, type: next.type, text: next.text };
      }),
    );

    if (transformedText !== null) {
      window.requestAnimationFrame(() => {
        sourceNode.textContent = transformedText;
        moveCaretToEnd(sourceNode);
      });
    }
  }

  function insertBlock(afterId: string, type: BlockType = "paragraph") {
    const nextBlock = createBlock(type);

    setBlocks((current) => {
      const index = current.findIndex((block) => block.id === afterId);
      const next = [...current];
      next.splice(index + 1, 0, nextBlock);
      return next;
    });
    setFocusId(nextBlock.id);
  }

  function removeBlock(id: string) {
    setBlocks((current) => {
      if (current.length === 1) {
        return [{ ...current[0], type: "paragraph", text: "" }];
      }

      const index = current.findIndex((block) => block.id === id);
      const next = current.filter((block) => block.id !== id);
      const fallback = next[Math.max(0, index - 1)];
      setFocusId(fallback.id);
      return next;
    });
  }

  function changeBlockType(id: string, type: BlockType) {
    setBlocks((current) =>
      current.map((block) => (block.id === id ? { ...block, type } : block)),
    );
    setFocusId(id);
  }

  function getActiveBlockId() {
    const eventBlock = getEventBlock(document.activeElement);
    return eventBlock?.block.id ?? currentBlockId ?? blocks[blocks.length - 1]?.id;
  }

  function runToolbarCommand(type: BlockType) {
    const activeId = getActiveBlockId();
    if (!activeId) return;

    changeBlockType(activeId, type);
  }

  function insertToolbarBlock(type: BlockType) {
    const activeId = getActiveBlockId();
    if (!activeId) return;

    insertBlock(activeId, type);
  }

  function runCommand(command: Command) {
    if (!commandBlockId) return;

    setBlocks((current) =>
      current.map((block) => {
        if (block.id !== commandBlockId) return block;

        const text = block.text.replace(/\/[\w\s-]*$/, "").trimEnd();

        return {
          ...block,
          type: command.type,
          text: command.type === "divider" ? "" : text,
        };
      }),
    );
    setFocusId(commandBlockId);
    setCommandBlockId(null);
    setCommandQuery("");
    setSelectedCommandIndex(0);
  }

  function closeCommandMenu() {
    setCommandBlockId(null);
    setCommandQuery("");
    setSelectedCommandIndex(0);
  }

  function handleCommandInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (filteredCommands.length) {
        setSelectedCommandIndex(
          (index) => (index + 1) % filteredCommands.length,
        );
      }
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (filteredCommands.length) {
        setSelectedCommandIndex(
          (index) =>
            (index - 1 + filteredCommands.length) % filteredCommands.length,
        );
      }
      return;
    }

    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      if (filteredCommands.length) {
        runCommand(
          filteredCommands[
            Math.min(selectedCommandIndex, filteredCommands.length - 1)
          ],
        );
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeCommandMenu();
    }
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLDivElement>,
    block: EditorBlock,
  ) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "c") {
      if (copySelectedBlocks()) {
        event.preventDefault();
      }
      return;
    }

    setCurrentBlockId(block.id);

    if (event.key === "Backspace" || event.key === "Delete") {
      if (deleteSelectedBlocks()) {
        event.preventDefault();
        return;
      }
    }

    if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      openCommandMenu(block.id);
      return;
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      insertBlock(block.id, block.type === "bullet" ? "bullet" : "paragraph");
    }

    if (event.key === "Backspace" && !block.text) {
      event.preventDefault();
      if (block.type === "bullet") {
        changeBlockType(block.id, "paragraph");
        return;
      }

      removeBlock(block.id);
    }
  }

  function handleEditorInput(event: FormEvent<HTMLDivElement>) {
    const eventBlock = getEventBlock(event.target);
    if (!eventBlock) return;

    setCurrentBlockId(eventBlock.block.id);
    updateBlock(
      eventBlock.block.id,
      eventBlock.node.textContent ?? "",
      eventBlock.node,
    );
  }

  function handleEditorKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const eventBlock = getEventBlock(event.target);
    const fallbackBlock = blocks.find((block) => block.id === currentBlockId);
    const block = eventBlock?.block ?? fallbackBlock;
    if (!block) return;

    setCurrentBlockId(block.id);
    handleKeyDown(event, block);
  }

  function handleEditorPointerUp(event: PointerEvent<HTMLDivElement>) {
    const eventBlock = getEventBlock(event.target);
    if (eventBlock) {
      setCurrentBlockId(eventBlock.block.id);
    }
  }

  function handlePaste(
    event: ClipboardEvent<HTMLDivElement>,
    block: EditorBlock,
  ) {
    const pastedText = event.clipboardData.getData("text/plain");
    if (!pastedText.trim()) return;

    event.preventDefault();
    closeCommandMenu();

    const pastedBlocks = markdownToEditorBlocks(pastedText);
    const focusTarget = pastedBlocks[pastedBlocks.length - 1]?.id;

    setBlocks((current) => {
      const index = current.findIndex((currentBlock) => currentBlock.id === block.id);
      if (index === -1) return current;

      const next = [...current];
      const shouldReplaceCurrentBlock = !block.text.trim();

      if (shouldReplaceCurrentBlock) {
        next.splice(index, 1, ...pastedBlocks);
      } else {
        next.splice(index + 1, 0, ...pastedBlocks);
      }

      return next;
    });

    if (focusTarget) {
      setFocusId(focusTarget);
    }
  }

  function handleEditorPaste(event: ClipboardEvent<HTMLDivElement>) {
    const eventBlock = getEventBlock(event.target);
    if (!eventBlock) return;

    handlePaste(event, eventBlock.block);
  }

  function handleEditorCopy(event: ClipboardEvent<HTMLDivElement>) {
    const selectedIds = getSelectedBlockIds();
    if (selectedIds.length < 2) return;

    const selectedMarkdown = blocks
      .filter((block) => selectedIds.includes(block.id))
      .map(blockToMarkdown)
      .join("\n\n");

    event.preventDefault();
    event.clipboardData.setData("text/plain", selectedMarkdown);
  }

  async function copyMarkdown() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="sticky top-0 z-20 border-b border-zinc-100 bg-white/90 backdrop-blur">
        <div className="flex w-full flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              Studio Hub Editor
            </p>
            <h1 className="text-xl font-semibold tracking-tight">
              Markdown page writer
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-600">
              {words} words
            </span>
            <span className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-600">
              {readingTime} min read
            </span>
            <button
              type="button"
              onClick={copyMarkdown}
              className="rounded-md bg-zinc-950 px-3 py-2 font-medium text-white transition-colors hover:bg-zinc-800"
            >
              {copied ? "Copied" : "Copy MD"}
            </button>
          </div>
        </div>
      </div>

      <section className="w-full px-4 py-10 md:px-12 lg:px-20">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-1 border-b border-zinc-100 bg-white px-3 py-2 text-zinc-600">
              {[
                { label: "T", title: "Text", action: () => runToolbarCommand("paragraph") },
                { label: "H1", title: "Heading 1", action: () => runToolbarCommand("title") },
                { label: "H2", title: "Heading 2", action: () => runToolbarCommand("heading2") },
                { label: "B", title: "Bold", action: () => document.execCommand("bold") },
                { label: "•", title: "Bullet", action: () => runToolbarCommand("bullet") },
                { label: "❝", title: "Quote", action: () => runToolbarCommand("quote") },
                { label: "</>", title: "Code", action: () => runToolbarCommand("code") },
                { label: "+", title: "Add block", action: () => insertToolbarBlock("paragraph") },
                { label: "—", title: "Divider", action: () => insertToolbarBlock("divider") },
                { label: "↶", title: "Undo", action: () => document.execCommand("undo") },
                { label: "↷", title: "Redo", action: () => document.execCommand("redo") },
              ].map((item) => (
                <button
                  key={item.title}
                  type="button"
                  title={item.title}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    item.action();
                  }}
                  className="flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors hover:bg-zinc-100 hover:text-zinc-950"
                >
                  {item.label}
                </button>
              ))}
              <div className="mx-2 h-5 w-px bg-zinc-200" />
              <span className="text-sm text-zinc-400">
                Type <span className="font-mono text-zinc-600">/</span> for commands
              </span>
            </div>

            <div
              ref={editorRootRef}
              contentEditable
              suppressContentEditableWarning
              spellCheck
              className="min-h-[calc(100vh-14rem)] space-y-2 bg-white px-8 py-10 outline-none md:px-12"
              onCopy={handleEditorCopy}
              onInput={handleEditorInput}
              onKeyDown={handleEditorKeyDown}
              onPaste={handleEditorPaste}
              onPointerUp={handleEditorPointerUp}
            >
              {blocks.map((block) => (
                <div
                  key={block.id}
                  className="group relative grid grid-cols-[24px_minmax(0,1fr)] gap-3 rounded-xl px-2 py-1 transition-colors hover:bg-zinc-50"
                >
                  <div
                    contentEditable={false}
                    className="pt-2 text-xs font-medium text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    {block.type === "paragraph" ? "" : labelFor(block.type)}
                  </div>

                  {block.type === "divider" ? (
                    <button
                      type="button"
                      contentEditable={false}
                      onClick={() => changeBlockType(block.id, "paragraph")}
                      className="my-3 border-t border-zinc-200 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-400"
                    >
                      Divider
                    </button>
                  ) : (
                    <div className="flex min-w-0 gap-2">
                      {block.type === "bullet" ? (
                        <span
                          contentEditable={false}
                          className="mt-3 text-lg text-zinc-400"
                        >
                          •
                        </span>
                      ) : null}
                      <div
                        data-block-id={block.id}
                        ref={(node) => syncEditableNode(node, block)}
                        className={getBlockClass(block.type)}
                        dir="ltr"
                      />
                    </div>
                  )}

                  {commandBlockId === block.id ? (
                    <div
                      contentEditable={false}
                      className="absolute left-8 top-11 z-30 w-[min(560px,calc(100vw-3rem))] overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/92 text-zinc-950 shadow-[0_28px_80px_rgba(24,24,27,0.18)] ring-1 ring-zinc-950/5 backdrop-blur-2xl"
                    >
                      <div className="border-b border-zinc-200/70 px-4 py-3">
                        <div className="flex items-center gap-3 rounded-2xl bg-zinc-100/80 px-3 py-2 text-zinc-500 ring-1 ring-zinc-200/80">
                          <span className="text-xl leading-none">⌕</span>
                          <span className="font-mono text-sm text-zinc-400">
                            /
                          </span>
                          <input
                            ref={commandInputRef}
                            value={commandQuery}
                            onChange={(event) => {
                              setCommandQuery(event.target.value);
                              setSelectedCommandIndex(0);
                            }}
                            onKeyDown={handleCommandInputKeyDown}
                            placeholder="Search..."
                            className="min-h-6 flex-1 bg-transparent text-lg text-zinc-900 outline-none placeholder:text-zinc-400"
                          />
                        </div>
                      </div>

                      <div className="command-menu-scrollbar max-h-96 overflow-auto px-3 py-3">
                        {filteredCommands.length ? (
                          (Object.keys(groupedCommands) as Command["group"][]).map(
                            (group) =>
                              groupedCommands[group].length ? (
                                <div key={group} className="mb-4 last:mb-0">
                                  <p className="px-3 pb-2 text-sm font-semibold text-zinc-400">
                                    {group}
                                  </p>
                                  <div className="space-y-1">
                                    {groupedCommands[group].map((command) => {
                                      const index = filteredCommands.findIndex(
                                        (item) => item.type === command.type,
                                      );

                                      return (
                                        <button
                                          key={command.type}
                                          type="button"
                                          onMouseDown={(event) => {
                                            event.preventDefault();
                                            runCommand(command);
                                          }}
                                          onMouseEnter={() =>
                                            setSelectedCommandIndex(index)
                                          }
                                          className={`grid w-full grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl px-3 py-3 text-left text-lg transition-colors ${
                                            index === selectedCommandIndex
                                              ? "bg-zinc-100 text-zinc-950 shadow-sm ring-1 ring-zinc-200"
                                              : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
                                          }`}
                                        >
                                          <span className="flex size-8 items-center justify-center rounded-lg bg-zinc-100 text-sm font-semibold text-zinc-500 ring-1 ring-zinc-200/70">
                                            {labelFor(command.type)}
                                          </span>
                                          <span>
                                            <span className="block font-medium">
                                              {command.label}
                                            </span>
                                            <span className="block text-sm text-zinc-400">
                                              {command.hint}
                                            </span>
                                          </span>
                                          <span className="font-mono text-sm text-zinc-400">
                                            {command.shortcut}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : null,
                          )
                        ) : (
                          <p className="px-4 py-5 text-zinc-500">
                            No commands found
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          closeCommandMenu();
                        }}
                        className="flex w-full items-center justify-between border-t border-zinc-200/70 px-5 py-4 text-left text-lg font-medium text-zinc-700 hover:bg-zinc-50"
                      >
                        Close menu
                        <span className="text-zinc-400">esc</span>
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-8 md:px-12 lg:px-20">
        <details className="mx-auto max-w-5xl rounded-lg border border-zinc-200 bg-white">
          <summary className="cursor-pointer px-5 py-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Markdown output
          </summary>
          <textarea
            readOnly
            value={markdown}
            className="min-h-72 w-full resize-y border-t border-zinc-100 bg-zinc-950 p-5 font-mono text-sm leading-7 text-zinc-100 outline-none"
          />
        </details>
      </section>
    </main>
  );
}
