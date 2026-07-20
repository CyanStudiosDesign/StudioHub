"use client";

import {
  ClipboardEvent,
  FormEvent,
  KeyboardEvent,
  PointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ExternalLink, FolderOpen, Link2, Search, X } from "lucide-react";
import { MarkdownBlock, parseMarkdown } from "@/doc/markdown-renderer";

type BlockType =
  | "title"
  | "heading2"
  | "heading3"
  | "paragraph"
  | "bullet"
  | "link"
  | "quote"
  | "code"
  | "divider";

type EditorBlock = {
  id: string;
  type: BlockType;
  text: string;
  href?: string;
};

type SaveWorkspace = {
  id: string;
  name: string;
  slug: string;
  icon: string;
};

type Command = {
  type: BlockType;
  label: string;
  hint: string;
  shortcut: string;
  group: "Basic" | "Blocks";
};

const storageKey = "studio-hub-markdown-editor-v2";
const autosaveDelayMs = 5000;

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
    type: "link",
    label: "Link",
    hint: "Insert a clickable URL",
    shortcut: "[ ]( )",
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

function createBlock(
  type: BlockType = "paragraph",
  text = "",
  href?: string,
): EditorBlock {
  return {
    id: crypto.randomUUID(),
    type,
    text,
    href,
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

  if (block.type === "link") {
    return `[${block.text || "Link text"}](${block.href || "https://example.com"})`;
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
  const exactLink =
    block.type === "paragraph"
      ? /^\[([^\]]+)\]\(([^)]+)\)$/.exec(block.text.trim())
      : null;

  if (exactLink) {
    return [createBlock("link", exactLink[1], exactLink[2])];
  }

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

type MarkdownEditorProps = {
  workspaceId?: string;
  documentId?: string;
  initialTitle?: string;
  initialMarkdown?: string;
  availableWorkspaces?: SaveWorkspace[];
};

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

  if (type === "link") {
    return `${shared} text-lg font-medium leading-relaxed text-blue-600 underline decoration-blue-200 underline-offset-4 md:text-xl`;
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
  if (type === "link") return "Link";
  if (type === "quote") return "Quote";
  if (type === "code") return "Code";
  if (type === "divider") return "Rule";
  return "Text";
}

export default function MarkdownEditor({
  workspaceId,
  documentId,
  initialTitle = "untitled",
  initialMarkdown = "",
  availableWorkspaces = [],
}: MarkdownEditorProps) {
  const initialBlocks = useMemo(
    () => (initialMarkdown ? markdownToEditorBlocks(initialMarkdown) : starterBlocks),
    [initialMarkdown],
  );
  const [blocks, setBlocks] = useState<EditorBlock[]>(initialBlocks);
  const [savedDocumentId, setSavedDocumentId] = useState(documentId);
  const [title, setTitle] = useState(initialTitle || "untitled");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">(
    documentId ? "saved" : "idle",
  );
  const [saveError, setSaveError] = useState("");
  const [lastSavedMarkdown, setLastSavedMarkdown] = useState(initialMarkdown);
  const [lastSavedTitle, setLastSavedTitle] = useState(initialTitle || "untitled");
  const [focusId, setFocusId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [commandBlockId, setCommandBlockId] = useState<string | null>(null);
  const [commandQuery, setCommandQuery] = useState("");
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [currentBlockId, setCurrentBlockId] = useState(initialBlocks[0].id);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(workspaceId ?? "");
  const [workspacePickerOpen, setWorkspacePickerOpen] = useState(false);
  const [workspaceSearch, setWorkspaceSearch] = useState("");
  const [linkEditorBlockId, setLinkEditorBlockId] = useState<string | null>(null);
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const editorRootRef = useRef<HTMLDivElement | null>(null);
  const commandInputRef = useRef<HTMLInputElement | null>(null);
  const storageLoaded = useRef(false);
  const savingRef = useRef(false);

  useEffect(() => {
    if (workspaceId || documentId || initialMarkdown) {
      storageLoaded.current = true;
      return;
    }

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
  }, [documentId, initialMarkdown, workspaceId]);

  useEffect(() => {
    if (workspaceId || documentId) return;
    if (!storageLoaded.current) return;

    window.localStorage.setItem(storageKey, JSON.stringify(blocks));
  }, [blocks, documentId, workspaceId]);

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
  const saveWorkspaceId = workspaceId ?? selectedWorkspaceId;
  const selectedWorkspace = availableWorkspaces.find(
    (workspace) => workspace.id === saveWorkspaceId,
  );
  const filteredWorkspaces = availableWorkspaces.filter((workspace) => {
    const query = workspaceSearch.trim().toLowerCase();
    if (!query) return true;

    return (
      workspace.name.toLowerCase().includes(query) ||
      workspace.slug.toLowerCase().includes(query)
    );
  });
  const hasRemoteSave = Boolean(saveWorkspaceId || savedDocumentId);
  const hasUnsavedChanges =
    markdown !== lastSavedMarkdown || title.trim() !== lastSavedTitle;
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

          return { ...block, type: "paragraph", text: "", href: undefined };
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

        if (command.type === "link") {
          return {
            ...block,
            type: "link",
            text: text || "Link text",
            href: block.href || "https://example.com",
          };
        }

        return {
          ...block,
          type: command.type,
          text: command.type === "divider" ? "" : text,
        };
      }),
    );
    setFocusId(commandBlockId);
    if (command.type === "link") {
      setLinkEditorBlockId(commandBlockId);
    }
    setCommandBlockId(null);
    setCommandQuery("");
    setSelectedCommandIndex(0);
  }

  function closeCommandMenu() {
    setCommandBlockId(null);
    setCommandQuery("");
    setSelectedCommandIndex(0);
  }

  function updateLinkHref(id: string, href: string) {
    setBlocks((current) =>
      current.map((block) =>
        block.id === id ? { ...block, href: href.trim() } : block,
      ),
    );
  }

  function openLink(block: EditorBlock) {
    if (!block.href) return;
    window.open(block.href, "_blank", "noopener,noreferrer");
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

  const saveDocument = useCallback(async (
    source: "manual" | "auto" = "manual",
    workspaceOverrideId?: string,
  ) => {
    const targetWorkspaceId = workspaceOverrideId ?? saveWorkspaceId;

    if (!savedDocumentId && !targetWorkspaceId) {
      if (source === "manual") {
        setWorkspacePickerOpen(true);
        setSaveError("");
      }
      return;
    }

    if (savingRef.current) return;
    if (source === "auto" && !hasUnsavedChanges) return;

    savingRef.current = true;
    setSaveStatus("saving");
    setSaveError("");

    const endpoint = savedDocumentId
      ? `/api/documents/${savedDocumentId}`
      : "/api/documents";
    const method = savedDocumentId ? "PATCH" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId: targetWorkspaceId,
          markdown,
          title: title.trim() || "untitled",
          folderPath: "/",
        }),
      });
      const result = (await response.json()) as {
        document?: { id: string };
        error?: string;
      };

      if (!response.ok || !result.document) {
        throw new Error(result.error ?? "Unable to save document.");
      }

      if (!savedDocumentId) {
        setSavedDocumentId(result.document.id);
        if (targetWorkspaceId) {
          setSelectedWorkspaceId(targetWorkspaceId);
        }
        setWorkspacePickerOpen(false);
        const url = new URL(window.location.href);
        url.searchParams.set("docId", result.document.id);
        window.history.replaceState(null, "", url);
      }

      setLastSavedMarkdown(markdown);
      setLastSavedTitle(title.trim() || "untitled");
      setSaveStatus("saved");
    } catch (error) {
      setSaveStatus("error");
      setSaveError(
        error instanceof Error ? error.message : "Unable to save document.",
      );
    } finally {
      savingRef.current = false;
    }
  }, [hasUnsavedChanges, markdown, savedDocumentId, saveWorkspaceId, title]);

  useEffect(() => {
    if (!hasRemoteSave || !hasUnsavedChanges) return;

    const timeoutId = window.setTimeout(() => {
      void saveDocument("auto");
    }, autosaveDelayMs);

    return () => window.clearTimeout(timeoutId);
  }, [hasRemoteSave, hasUnsavedChanges, saveDocument]);

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="sticky top-0 z-20 border-b border-zinc-100 bg-white/90 backdrop-blur">
        <div className="flex w-full flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              Studio Hub Editor
            </p>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onBlur={() => {
                if (!title.trim()) {
                  setTitle("untitled");
                }
              }}
              aria-label="Document title"
              className="mt-1 w-full max-w-xl bg-transparent text-xl font-semibold tracking-tight text-zinc-950 outline-none placeholder:text-zinc-300"
              placeholder="untitled"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-600">
              {words} words
            </span>
            <span className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-600">
              {readingTime} min read
            </span>
            {hasRemoteSave ? (
              <span className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-500">
                {saveStatus === "saving"
                  ? "Saving..."
                  : saveStatus === "saved" && !hasUnsavedChanges
                    ? "Saved"
                    : saveStatus === "error"
                      ? "Save failed"
                      : "Unsaved"}
              </span>
            ) : null}
            {!savedDocumentId && selectedWorkspace ? (
              <button
                type="button"
                onClick={() => setWorkspacePickerOpen(true)}
                className="rounded-md border border-zinc-200 bg-white px-3 py-2 font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-950"
              >
                {selectedWorkspace.name}
              </button>
            ) : null}
            <button
              type="button"
              onClick={copyMarkdown}
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:text-zinc-950"
            >
              {copied ? "Copied" : "Copy MD"}
            </button>
            <button
              type="button"
              onClick={() => void saveDocument("manual")}
              disabled={saveStatus === "saving"}
              className="rounded-md bg-zinc-950 px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save
            </button>
          </div>
        </div>
        {saveError ? (
          <div className="border-t border-red-100 bg-red-50 px-5 py-2 text-sm text-red-700 md:px-8">
            {saveError}
          </div>
        ) : null}
      </div>

      {workspacePickerOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/25 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="workspace-picker-title"
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_30px_100px_rgba(24,24,27,0.22)]">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Save location
                </p>
                <h2
                  id="workspace-picker-title"
                  className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950"
                >
                  Choose a workspace
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Pick where this Markdown document should live.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWorkspacePickerOpen(false)}
                className="flex size-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-950"
                aria-label="Close workspace picker"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="border-b border-zinc-100 px-6 py-4">
              <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-500">
                <Search className="size-4" />
                <input
                  value={workspaceSearch}
                  onChange={(event) => setWorkspaceSearch(event.target.value)}
                  placeholder="Search workspaces"
                  className="w-full bg-transparent text-sm text-zinc-950 outline-none placeholder:text-zinc-400"
                  autoFocus
                />
              </label>
            </div>

            <div className="max-h-[420px] overflow-auto p-3">
              {filteredWorkspaces.length ? (
                <div className="space-y-1">
                  {filteredWorkspaces.map((workspace) => {
                    const isSelected = workspace.id === saveWorkspaceId;

                    return (
                      <button
                        key={workspace.id}
                        type="button"
                        onClick={() => void saveDocument("manual", workspace.id)}
                        disabled={saveStatus === "saving"}
                        className={`grid w-full grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                          isSelected
                            ? "bg-zinc-950 text-white"
                            : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                        }`}
                      >
                        <span
                          className={`flex size-11 items-center justify-center rounded-xl text-lg font-semibold ${
                            isSelected
                              ? "bg-white text-zinc-950"
                              : "bg-zinc-950 text-white"
                          }`}
                        >
                          {workspace.icon || workspace.name.slice(0, 1)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">
                            {workspace.name}
                          </span>
                          <span
                            className={`block truncate text-sm ${
                              isSelected ? "text-zinc-300" : "text-zinc-500"
                            }`}
                          >
                            {workspace.slug}
                          </span>
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            isSelected
                              ? "bg-white/15 text-white"
                              : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {saveStatus === "saving" && isSelected
                            ? "Saving..."
                            : "Save here"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center">
                  <FolderOpen className="mx-auto size-10 text-zinc-300" />
                  <p className="mt-4 font-semibold text-zinc-900">
                    No workspaces found
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    Create or join a workspace before saving this document.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

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
                      {block.type === "link" ? (
                        <button
                          type="button"
                          contentEditable={false}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() =>
                            setLinkEditorBlockId((current) =>
                              current === block.id ? null : block.id,
                            )
                          }
                          className="mt-2 flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-100 transition-colors hover:bg-blue-100"
                          aria-label="Edit link URL"
                        >
                          <Link2 className="size-4" />
                        </button>
                      ) : null}
                      <div
                        data-block-id={block.id}
                        ref={(node) => syncEditableNode(node, block)}
                        className={getBlockClass(block.type)}
                        dir="ltr"
                      />
                    </div>
                  )}

                  {linkEditorBlockId === block.id && block.type === "link" ? (
                    <div
                      contentEditable={false}
                      className="absolute left-8 top-12 z-30 w-[min(420px,calc(100vw-3rem))] rounded-2xl border border-zinc-200 bg-white p-3 text-zinc-950 shadow-[0_24px_70px_rgba(24,24,27,0.18)] ring-1 ring-zinc-950/5"
                    >
                      <div className="flex items-center gap-2">
                        <label className="sr-only" htmlFor={`link-url-${block.id}`}>
                          Link URL
                        </label>
                        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                          <Link2 className="size-4 shrink-0 text-zinc-400" />
                          <input
                            id={`link-url-${block.id}`}
                            value={block.href ?? ""}
                            onChange={(event) =>
                              updateLinkHref(block.id, event.target.value)
                            }
                            onKeyDown={(event) => {
                              event.stopPropagation();
                              if (event.key === "Escape") {
                                setLinkEditorBlockId(null);
                              }
                            }}
                            placeholder="https://example.com"
                            className="min-w-0 flex-1 bg-transparent text-sm text-zinc-950 outline-none placeholder:text-zinc-400"
                            autoFocus
                          />
                        </div>
                        <button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => openLink(block)}
                          className="flex size-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-950"
                          aria-label="Open link"
                        >
                          <ExternalLink className="size-4" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => setLinkEditorBlockId(null)}
                          className="flex size-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-950"
                          aria-label="Close link editor"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    </div>
                  ) : null}

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
