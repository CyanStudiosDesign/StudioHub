"use client";

import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { Placeholder } from "@tiptap/extensions";
import type { Editor } from "@tiptap/core";
import DragHandle from "@tiptap/extension-drag-handle";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import Image from "@tiptap/extension-image";
import FileHandler from "@tiptap/extension-file-handler";
import Emoji from "@tiptap/extension-emoji";
import Audio from "@tiptap/extension-audio";
import { Details, DetailsContent, DetailsSummary } from "@tiptap/extension-details";
import Youtube, { isValidYoutubeUrl } from "@tiptap/extension-youtube";
import {
  AudioLines,
  Bold,
  CheckSquare,
  ChevronRight,
  Code2,
  Copy,
  Download,
  FolderOpen,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Search,
  Smile,
  Strikethrough,
  Underline,
  Undo2,
  Unlink,
  Video as VideoIcon,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  coerceTiptapDocument,
  emptyTiptapDocument,
  ensureTiptapTitle,
  markdownToTiptapDocument,
  tiptapDocumentText,
  tiptapDocumentToMarkdown,
  type TiptapDocument,
} from "@/lib/tiptap-document";
import { Video } from "@/editor/Video";
import { RequiredTitle } from "@/editor/RequiredTitle";
import { NotionShortcuts } from "@/editor/NotionShortcuts";
import { ContextMenu, ContextMenuContent, ContextMenuItem } from "@/components/ui/contextmenu";
import { Select, SelectGroup, SelectItem } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";

type SaveWorkspace = {
  id: string;
  name: string;
  slug: string;
  icon: string;
};

const lowlight = createLowlight(common);

type MarkdownEditorProps = {
  workspaceId?: string;
  documentId?: string;
  initialTitle?: string;
  initialContent?: TiptapDocument;
  initialVisibility?: "public" | "private" | "workspace";
  availableWorkspaces?: SaveWorkspace[];
};

type SlashCommand = {
  label: string;
  hint: string;
  shortcut: string;
  keywords: string[];
  run: () => void;
};

type SlashRange = { from: number; to: number };

const storageKey = "studio-hub-tiptap-editor-v1";
const legacyStorageKey = "studio-hub-markdown-editor-v2";
const autosaveDelayMs = 5000;
const maxEmbeddedFileBytes = 8 * 1024 * 1024;
const allowedMediaTypes = [
  "image/png", "image/jpeg", "image/gif", "image/webp",
  "audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/webm",
  "video/mp4", "video/webm", "video/ogg",
];

const emojiChoices = [
  { shortcode: "grinning", emoji: "😀", label: "Grinning face" },
  { shortcode: "smiley", emoji: "😃", label: "Smiley" },
  { shortcode: "joy", emoji: "😂", label: "Joy" },
  { shortcode: "heart_eyes", emoji: "😍", label: "Heart eyes" },
  { shortcode: "thinking", emoji: "🤔", label: "Thinking" },
  { shortcode: "thumbsup", emoji: "👍", label: "Thumbs up" },
  { shortcode: "clap", emoji: "👏", label: "Clap" },
  { shortcode: "tada", emoji: "🎉", label: "Celebration" },
  { shortcode: "fire", emoji: "🔥", label: "Fire" },
  { shortcode: "eyes", emoji: "👀", label: "Eyes" },
  { shortcode: "white_check_mark", emoji: "✅", label: "Check" },
  { shortcode: "rocket", emoji: "🚀", label: "Rocket" },
];

function fileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () =>
      typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Unable to read file.")),
    );
    reader.addEventListener("error", () => reject(reader.error ?? new Error("Unable to read file.")));
    reader.readAsDataURL(file);
  });
}

async function mediaFileToNode(file: File) {
  if (file.size > maxEmbeddedFileBytes) {
    window.alert(`${file.name} is larger than 8 MB and was not added.`);
    return null;
  }

  const src = await fileAsDataUrl(file);
  if (file.type.startsWith("image/")) {
    return { type: "image", attrs: { src, alt: file.name, title: file.name } };
  }
  if (file.type.startsWith("audio/")) {
    return { type: "audio", attrs: { src } };
  }
  if (file.type.startsWith("video/")) {
    return { type: "video", attrs: { src, title: file.name } };
  }
  return null;
}

function insertMediaFiles(editor: Editor, files: File[], position?: number) {
  void Promise.all(files.map(mediaFileToNode)).then((nodes) => {
    const content = nodes.filter((node) => node !== null);
    if (!content.length) return;

    const at = position ?? editor.state.selection.from;
    editor.chain().focus().insertContentAt(at, content).run();
  });
}

function getSlashMatch(editor: Editor) {
  const { selection } = editor.state;
  if (!selection.empty || !selection.$from.parent.isTextblock) return null;
  if (selection.$from.parent.type.name === "codeBlock") return null;

  const textBeforeCursor = selection.$from.parent.textBetween(
    0,
    selection.$from.parentOffset,
    undefined,
    "\ufffc",
  );
  const slashIndex = textBeforeCursor.lastIndexOf("/");
  if (slashIndex < 0) return null;

  const characterBeforeSlash = textBeforeCursor[slashIndex - 1];
  if (characterBeforeSlash && !/\s/.test(characterBeforeSlash)) return null;

  const query = textBeforeCursor.slice(slashIndex + 1);
  if (query.includes("/") || query.length > 80) return null;

  return {
    query,
    range: {
      from: selection.from - query.length - 1,
      to: selection.from,
    },
  };
}

function duplicateCurrentBlock(editor: Editor) {
  const { $from } = editor.state.selection;
  if ($from.depth < 1) return;
  const block = $from.node(1);
  const blockStart = $from.before(1);
  editor.chain().focus().insertContentAt(blockStart + block.nodeSize, block.toJSON()).run();
}

function deleteCurrentBlock(editor: Editor) {
  const { $from } = editor.state.selection;
  if ($from.depth < 1 || $from.index(0) === 0) return;
  const block = $from.node(1);
  const blockStart = $from.before(1);
  editor.chain().focus().deleteRange({ from: blockStart, to: blockStart + block.nodeSize }).run();
}

function readLegacyLocalDocument(value: string): TiptapDocument | null {
  try {
    const blocks = JSON.parse(value) as Array<{
      type?: string;
      text?: string;
      href?: string;
    }>;
    if (!Array.isArray(blocks)) return null;

    const markdown = blocks.map((block) => {
      const text = typeof block.text === "string" ? block.text : "";
      if (block.type === "title") return `# ${text}`;
      if (block.type === "heading2") return `## ${text}`;
      if (block.type === "heading3") return `### ${text}`;
      if (block.type === "bullet") return `- ${text}`;
      if (block.type === "quote") return `> ${text}`;
      if (block.type === "code") return `\`\`\`\n${text}\n\`\`\``;
      if (block.type === "divider") return "---";
      if (block.type === "link") return `[${text || "Link text"}](${block.href || "https://example.com"})`;
      return text;
    }).join("\n\n");

    return markdownToTiptapDocument(markdown);
  } catch {
    return null;
  }
}

function readLocalDocument(value: string): TiptapDocument | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || !("type" in parsed) || parsed.type !== "doc") {
      return null;
    }
    return coerceTiptapDocument(parsed);
  } catch {
    return null;
  }
}

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`flex size-9 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
        active
          ? "bg-zinc-950 text-white"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
      }`}
    >
      {children}
    </button>
  );
}

export default function MarkdownEditor({
  workspaceId,
  documentId,
  initialTitle = "untitled",
  initialContent = emptyTiptapDocument,
  initialVisibility = "private",
  availableWorkspaces = [],
}: MarkdownEditorProps) {
  const toast = useToast();
  const normalizedInitialContent = useMemo(
    () => ensureTiptapTitle(coerceTiptapDocument(initialContent), initialTitle),
    [initialContent, initialTitle],
  );
  const [content, setContent] = useState<TiptapDocument>(normalizedInitialContent);
  const [savedDocumentId, setSavedDocumentId] = useState(documentId);
  const [title, setTitle] = useState(initialTitle || "untitled");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">(
    documentId ? "saved" : "idle",
  );
  const [saveError, setSaveError] = useState("");
  const [lastSavedContent, setLastSavedContent] = useState(
    JSON.stringify(normalizedInitialContent),
  );
  const [lastSavedTitle, setLastSavedTitle] = useState(initialTitle || "untitled");
  const [visibility, setVisibility] = useState(initialVisibility);
  const [lastSavedVisibility, setLastSavedVisibility] = useState(initialVisibility);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(workspaceId ?? "");
  const [workspacePickerOpen, setWorkspacePickerOpen] = useState(false);
  const [workspaceSearch, setWorkspaceSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashSearch, setSlashSearch] = useState("");
  const [slashRange, setSlashRange] = useState<SlashRange | null>(null);
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ left: 24, top: 120 });
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const savingRef = useRef(false);

  function syncSlashMenu(currentEditor: Editor) {
    const match = getSlashMatch(currentEditor);
    if (!match) {
      setSlashMenuOpen(false);
      setSlashRange(null);
      return;
    }

    const coordinates = currentEditor.view.coordsAtPos(match.range.to);
    setSlashSearch(match.query);
    setSlashRange(match.range);
    setSelectedSlashIndex(0);
    setSlashMenuPosition({
      left: Math.max(12, Math.min(coordinates.left, window.innerWidth - 540)),
      top: Math.min(coordinates.bottom + 8, window.innerHeight - 420),
    });
    setSlashMenuOpen(true);
  }

  function closeSlashMenu() {
    setSlashMenuOpen(false);
    setSlashRange(null);
    setSelectedSlashIndex(0);
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["http", "https", "mailto", "tel"],
          HTMLAttributes: {
            rel: "noopener noreferrer nofollow",
            target: "_blank",
          },
        },
      }),
      CodeBlockLowlight.configure({ lowlight }),
      Placeholder.configure({
        placeholder: ({ node, pos }) =>
          node.type.name === "heading"
            ? pos === 0 ? "Title" : "Heading"
            : "Type '/' for commands…",
      }),
      RequiredTitle,
      NotionShortcuts,
      TaskList,
      TaskItem.configure({ nested: true }),
      Details.configure({ persist: true }),
      DetailsSummary,
      DetailsContent,
      Image.configure({
        allowBase64: true,
        resize: {
          enabled: true,
          directions: ["top-left", "top-right", "bottom-left", "bottom-right"],
          minWidth: 120,
          minHeight: 80,
          alwaysPreserveAspectRatio: true,
        },
        HTMLAttributes: { class: "tiptap-image" },
      }),
      Audio.configure({ allowBase64: true }),
      Youtube.configure({ nocookie: true, width: 720, height: 405 }),
      Video,
      Emoji.configure({ enableEmoticons: true }),
      FileHandler.configure({
        allowedMimeTypes: allowedMediaTypes,
        consumePasteEvent: true,
        onPaste: (currentEditor, files) => insertMediaFiles(currentEditor, files),
        onDrop: (currentEditor, files, position) =>
          insertMediaFiles(currentEditor, files, position),
      }),
      DragHandle.configure({
        nested: {
          rules: [
            {
              id: "keep-page-title-fixed",
              evaluate: ({ node, parent, isFirst }) =>
                parent?.type.name === "doc" && isFirst && node.type.name === "heading"
                  ? 1000
                  : 0,
            },
          ],
        },
        render: () => {
          const handle = document.createElement("button");
          handle.type = "button";
          handle.className = "tiptap-drag-handle";
          handle.title = "Drag to move block";
          handle.setAttribute("aria-label", "Drag to move block");
          handle.textContent = "⠿";
          return handle;
        },
      }),
    ],
    content: normalizedInitialContent,
    editorProps: {
      attributes: {
        class: "tiptap-editor min-h-[calc(100vh-9rem)] px-5 py-10 outline-none md:px-10",
        spellcheck: "true",
      },
      handleKeyDown: (_view, event) => {
        if (slashMenuOpen && event.key === "ArrowDown") {
          event.preventDefault();
          setSelectedSlashIndex((index) =>
            visibleSlashCommands.length ? (index + 1) % visibleSlashCommands.length : 0,
          );
          return true;
        }
        if (slashMenuOpen && event.key === "ArrowUp") {
          event.preventDefault();
          setSelectedSlashIndex((index) =>
            visibleSlashCommands.length
              ? (index - 1 + visibleSlashCommands.length) % visibleSlashCommands.length
              : 0,
          );
          return true;
        }
        if (
          slashMenuOpen &&
          (event.key === "Enter" || event.key === "Tab") &&
          visibleSlashCommands[selectedSlashIndex]
        ) {
          event.preventDefault();
          visibleSlashCommands[selectedSlashIndex]?.run();
          return true;
        }
        if (slashMenuOpen && event.key === "Escape") {
          closeSlashMenu();
          return true;
        }
        if (event.key === "Escape") {
          setEmojiPickerOpen(false);
        }
        return false;
      },
      handleDOMEvents: {
        contextmenu: (view, event) => {
          if (view.state.selection.empty) return false;
          event.preventDefault();
          return true;
        },
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const nextContent = coerceTiptapDocument(currentEditor.getJSON());
      setContent(nextContent);
      setTitle(currentEditor.state.doc.firstChild?.textContent.trim().slice(0, 180) || "untitled");
      syncSlashMenu(currentEditor);
    },
    onSelectionUpdate: ({ editor: currentEditor }) => syncSlashMenu(currentEditor),
  });

  const activeState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      paragraph: currentEditor?.isActive("paragraph") ?? false,
      heading1: currentEditor?.isActive("heading", { level: 1 }) ?? false,
      heading2: currentEditor?.isActive("heading", { level: 2 }) ?? false,
      bold: currentEditor?.isActive("bold") ?? false,
      italic: currentEditor?.isActive("italic") ?? false,
      underline: currentEditor?.isActive("underline") ?? false,
      strike: currentEditor?.isActive("strike") ?? false,
      inlineCode: currentEditor?.isActive("code") ?? false,
      link: currentEditor?.isActive("link") ?? false,
      bulletList: currentEditor?.isActive("bulletList") ?? false,
      orderedList: currentEditor?.isActive("orderedList") ?? false,
      taskList: currentEditor?.isActive("taskList") ?? false,
      blockquote: currentEditor?.isActive("blockquote") ?? false,
      codeBlock: currentEditor?.isActive("codeBlock") ?? false,
      details: currentEditor?.isActive("details") ?? false,
      canUndo: currentEditor?.can().undo() ?? false,
      canRedo: currentEditor?.can().redo() ?? false,
    }),
  });

  useEffect(() => {
    if (!editor || workspaceId || documentId) return;

    const saved = window.localStorage.getItem(storageKey);
    const legacy = window.localStorage.getItem(legacyStorageKey);
    const restored = saved
      ? readLocalDocument(saved)
      : legacy
        ? readLegacyLocalDocument(legacy)
        : null;

    if (restored) {
      const titledDocument = ensureTiptapTitle(restored, initialTitle);
      editor.commands.setContent(titledDocument);
      window.localStorage.setItem(storageKey, JSON.stringify(titledDocument));
      window.localStorage.removeItem(legacyStorageKey);
    }
  }, [documentId, editor, initialTitle, workspaceId]);

  useEffect(() => {
    if (workspaceId || documentId) return;
    window.localStorage.setItem(storageKey, JSON.stringify(content));
  }, [content, documentId, workspaceId]);

  const markdown = useMemo(() => tiptapDocumentToMarkdown(content), [content]);
  const plainText = useMemo(() => tiptapDocumentText(content), [content]);
  const contentFingerprint = useMemo(() => JSON.stringify(content), [content]);
  const words = plainText ? plainText.split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(words / 180));
  const saveWorkspaceId = workspaceId ?? selectedWorkspaceId;
  const selectedWorkspace = availableWorkspaces.find(
    (workspace) => workspace.id === saveWorkspaceId,
  );
  const filteredWorkspaces = availableWorkspaces.filter((workspace) => {
    const query = workspaceSearch.trim().toLowerCase();
    return !query || workspace.name.toLowerCase().includes(query) || workspace.slug.toLowerCase().includes(query);
  });
  const hasRemoteSave = Boolean(saveWorkspaceId || savedDocumentId);
  const hasUnsavedChanges =
    contentFingerprint !== lastSavedContent ||
    title.trim() !== lastSavedTitle ||
    visibility !== lastSavedVisibility;

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previousUrl ?? "https://");
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }, [editor]);

  const insertImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Image URL", "https://");
    if (!url?.trim()) return;
    const alt = window.prompt("Image description (optional)", "") ?? "";
    editor.chain().focus().setImage({ src: url.trim(), alt }).run();
  }, [editor]);

  const insertVideo = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Video or YouTube URL", "https://");
    if (!url?.trim()) return;
    const src = url.trim();
    if (isValidYoutubeUrl(src)) {
      editor.chain().focus().setYoutubeVideo({ src }).run();
      return;
    }
    editor.chain().focus().insertContent({ type: "video", attrs: { src } }).run();
  }, [editor]);

  const insertAudio = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Audio URL", "https://");
    if (!url?.trim()) return;
    editor.chain().focus().setAudio({ src: url.trim() }).run();
  }, [editor]);

  const slashCommands = useMemo<SlashCommand[]>(() => {
    const run = (command: () => void) => () => {
      if (editor && slashRange) {
        editor.chain().focus().deleteRange(slashRange).run();
      }
      closeSlashMenu();
      command();
      setSlashSearch("");
    };

    return [
      { label: "Text", hint: "Plain paragraph", shortcut: "/text", keywords: ["text", "plain", "paragraph", "0"], run: run(() => editor?.chain().focus().setParagraph().run()) },
      { label: "Heading 1", hint: "Large section heading", shortcut: "/h1", keywords: ["heading 1", "h1", "#", "title", "large"], run: run(() => editor?.chain().focus().toggleHeading({ level: 1 }).run()) },
      { label: "Heading 2", hint: "Medium section heading", shortcut: "/h2", keywords: ["heading 2", "h2", "##", "medium"], run: run(() => editor?.chain().focus().toggleHeading({ level: 2 }).run()) },
      { label: "Heading 3", hint: "Small section heading", shortcut: "/h3", keywords: ["heading 3", "h3", "###", "small"], run: run(() => editor?.chain().focus().toggleHeading({ level: 3 }).run()) },
      { label: "Heading 4", hint: "Compact section heading", shortcut: "/h4", keywords: ["heading 4", "h4", "####", "compact"], run: run(() => editor?.chain().focus().toggleHeading({ level: 4 }).run()) },
      { label: "Code block", hint: "Preformatted code", shortcut: "/code", keywords: ["code", "snippet", "preformatted", "8"], run: run(() => editor?.chain().focus().toggleCodeBlock().run()) },
      { label: "Quote", hint: "Quotation block", shortcut: "/quote", keywords: ["quote", "quotation", "callout"], run: run(() => editor?.chain().focus().toggleBlockquote().run()) },
      { label: "To-do list", hint: "Checklist with completed state", shortcut: "/todo", keywords: ["todo", "to-do", "checkbox", "checklist", "task", "4"], run: run(() => editor?.chain().focus().toggleTaskList().run()) },
      { label: "Numbered list", hint: "Ordered list", shortcut: "/num", keywords: ["numbered", "number", "num", "ordered", "1.", "6"], run: run(() => editor?.chain().focus().toggleOrderedList().run()) },
      { label: "Bullet list", hint: "Unordered list", shortcut: "/bullet", keywords: ["bullet", "bulleted", "unordered", "list", "-", "5"], run: run(() => editor?.chain().focus().toggleBulletList().run()) },
      { label: "Toggle list", hint: "Collapsible details section", shortcut: "/toggle", keywords: ["toggle", "collapsible", "details", "7"], run: run(() => editor?.chain().focus().setDetails().run()) },
      { label: "Divider", hint: "Horizontal rule", shortcut: "/div", keywords: ["divider", "div", "separator", "rule", "hr", "---"], run: run(() => editor?.chain().focus().setHorizontalRule().run()) },
      { label: "Image", hint: "Embed an image from a URL", shortcut: "/image", keywords: ["image", "photo", "picture", "upload", "media"], run: run(insertImage) },
      { label: "Video", hint: "Embed video or YouTube", shortcut: "/video", keywords: ["video", "youtube", "movie", "media"], run: run(insertVideo) },
      { label: "Audio", hint: "Embed an audio player", shortcut: "/audio", keywords: ["audio", "sound", "music", "media"], run: run(insertAudio) },
      { label: "Link", hint: "Add a link to selected text", shortcut: "/link", keywords: ["link", "url", "web"], run: run(setLink) },
      { label: "Duplicate block", hint: "Copy the current block", shortcut: "/duplicate", keywords: ["duplicate", "copy", "clone", "block"], run: run(() => editor && duplicateCurrentBlock(editor)) },
      { label: "Delete block", hint: "Remove the current block", shortcut: "/delete", keywords: ["delete", "remove", "trash", "block"], run: run(() => editor && deleteCurrentBlock(editor)) },
      { label: "Clear formatting", hint: "Return text to its default style", shortcut: "/clear", keywords: ["clear", "default", "remove formatting"], run: run(() => editor?.chain().focus().unsetAllMarks().clearNodes().run()) },
      {
        label: "Emoji",
        hint: "Choose an emoji",
        shortcut: "/emoji",
        keywords: ["emoji", "smile", "icon", "emoticon"],
        run: () => {
          if (editor && slashRange) {
            editor.chain().focus().deleteRange(slashRange).run();
          }
          closeSlashMenu();
          setEmojiPickerOpen(true);
        },
      },
    ];
  }, [editor, insertAudio, insertImage, insertVideo, setLink, slashRange]);

  const visibleSlashCommands = slashCommands.filter((command) => {
    const query = slashSearch.trim().toLowerCase();
    return !query ||
      command.label.toLowerCase().includes(query) ||
      command.hint.toLowerCase().includes(query) ||
      command.keywords.some((keyword) => keyword.includes(query));
  });

  async function copyMarkdown() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  function exportMarkdown() {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeTitle = (title.trim() || "untitled").replace(/[^a-z0-9-_]+/gi, "-").replace(/^-|-$/g, "");
    link.href = url;
    link.download = `${safeTitle || "untitled"}.md`;
    link.click();
    URL.revokeObjectURL(url);
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
    if (savingRef.current || (source === "auto" && !hasUnsavedChanges)) return;

    const savedFingerprint = contentFingerprint;
    const savedTitle = title.trim() || "untitled";
    savingRef.current = true;
    setSaveStatus("saving");
    setSaveError("");

    try {
      const response = await fetch(
        savedDocumentId ? `/api/documents/${savedDocumentId}` : "/api/documents",
        {
          method: savedDocumentId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId: targetWorkspaceId,
            content,
            title: savedTitle,
            folderPath: "/",
            visibility,
          }),
        },
      );
      const result = (await response.json()) as { document?: { id: string }; error?: string };
      if (!response.ok || !result.document) {
        throw new Error(result.error ?? "Unable to save document.");
      }

      if (!savedDocumentId) {
        setSavedDocumentId(result.document.id);
        if (targetWorkspaceId) setSelectedWorkspaceId(targetWorkspaceId);
        setWorkspacePickerOpen(false);
        const url = new URL(window.location.href);
        url.searchParams.set("docId", result.document.id);
        window.history.replaceState(null, "", url);
      }

      setLastSavedContent(savedFingerprint);
      setLastSavedTitle(savedTitle);
      setLastSavedVisibility(visibility);
      setSaveStatus("saved");
      if (source === "manual") toast({ message: savedDocumentId ? "Document saved" : "Document created", description: "Your changes are safely stored as structured editor data." });
    } catch (error) {
      setSaveStatus("error");
      setSaveError(error instanceof Error ? error.message : "Unable to save document.");
    } finally {
      savingRef.current = false;
    }
  }, [content, contentFingerprint, hasUnsavedChanges, saveWorkspaceId, savedDocumentId, title, toast, visibility]);

  useEffect(() => {
    if (!hasRemoteSave || !hasUnsavedChanges) return;
    const timeoutId = window.setTimeout(() => void saveDocument("auto"), autosaveDelayMs);
    return () => window.clearTimeout(timeoutId);
  }, [hasRemoteSave, hasUnsavedChanges, saveDocument]);

  return (
    <main className="app-theme min-h-screen bg-canvas text-fg">
      <div className="sticky top-0 z-20 border-b border-border bg-canvas/90 backdrop-blur">
        <div className="flex w-full flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Studio Hub</p>
            <p className="mt-1 text-sm font-medium text-zinc-600">Document editor</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Select title="Visibility" value={visibility} onValueChange={(value) => setVisibility(value as typeof visibility)} className="w-44"><SelectGroup><SelectItem value="private">Private</SelectItem><SelectItem value="workspace">Workspace only</SelectItem><SelectItem value="public">Public</SelectItem></SelectGroup></Select>
            <span className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-600">{words} words</span>
            <span className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-600">{readingTime} min read</span>
            {hasRemoteSave ? (
              <span className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-500">
                {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" && !hasUnsavedChanges ? "Saved" : saveStatus === "error" ? "Save failed" : "Unsaved"}
              </span>
            ) : null}
            {!savedDocumentId && selectedWorkspace ? (
              <button type="button" onClick={() => setWorkspacePickerOpen(true)} className="rounded-md border border-zinc-200 bg-white px-3 py-2 font-medium text-zinc-600 hover:text-zinc-950">
                {selectedWorkspace.name}
              </button>
            ) : null}
            <button type="button" onClick={copyMarkdown} className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 font-medium text-zinc-700 hover:text-zinc-950">
              <Copy className="size-4" /> {copied ? "Copied" : "Copy MD"}
            </button>
            <button type="button" onClick={exportMarkdown} className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 font-medium text-zinc-700 hover:text-zinc-950">
              <Download className="size-4" /> Export MD
            </button>
            <button type="button" onClick={() => void saveDocument("manual")} disabled={saveStatus === "saving"} className="rounded-md bg-zinc-950 px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-60">
              Save
            </button>
          </div>
        </div>
        {saveError ? <div className="border-t border-red-100 bg-red-50 px-5 py-2 text-sm text-red-700 md:px-8">{saveError}</div> : null}
      </div>

      {workspacePickerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/25 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="workspace-picker-title">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_30px_100px_rgba(24,24,27,0.22)]">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Save location</p>
                <h2 id="workspace-picker-title" className="mt-1 text-2xl font-semibold tracking-tight">Choose a workspace</h2>
                <p className="mt-1 text-sm text-zinc-500">Pick where this document should live.</p>
              </div>
              <button type="button" onClick={() => setWorkspacePickerOpen(false)} className="flex size-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-500" aria-label="Close workspace picker"><X className="size-4" /></button>
            </div>
            <div className="border-b border-zinc-100 px-6 py-4">
              <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-500">
                <Search className="size-4" />
                <input value={workspaceSearch} onChange={(event) => setWorkspaceSearch(event.target.value)} placeholder="Search workspaces" className="w-full bg-transparent text-sm text-zinc-950 outline-none" autoFocus />
              </label>
            </div>
            <div className="max-h-[420px] overflow-auto p-3">
              {filteredWorkspaces.length ? filteredWorkspaces.map((workspace) => (
                <button key={workspace.id} type="button" onClick={() => void saveDocument("manual", workspace.id)} disabled={saveStatus === "saving"} className="grid w-full grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl px-4 py-3 text-left text-zinc-700 hover:bg-zinc-100 disabled:opacity-60">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-zinc-950 text-lg font-semibold text-white">{workspace.icon || workspace.name.slice(0, 1)}</span>
                  <span className="min-w-0"><span className="block truncate font-semibold">{workspace.name}</span><span className="block truncate text-sm text-zinc-500">{workspace.slug}</span></span>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500">Save here</span>
                </button>
              )) : (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center">
                  <FolderOpen className="mx-auto size-10 text-zinc-300" /><p className="mt-4 font-semibold">No workspaces found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <section className="min-h-[calc(100vh-5rem)] w-full bg-canvas px-4 md:px-12 lg:px-20">
        <div className="mx-auto min-h-[calc(100vh-5rem)] max-w-5xl">
          <div className="relative min-h-[calc(100vh-5rem)] overflow-visible bg-canvas">
            <div className="flex flex-wrap items-center gap-1 bg-canvas px-3 py-3">
              <ToolbarButton label="Paragraph" active={activeState?.paragraph} onClick={() => editor?.chain().focus().setParagraph().run()}><Pilcrow className="size-4" /></ToolbarButton>
              <ToolbarButton label="Heading 1" active={activeState?.heading1} onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="size-4" /></ToolbarButton>
              <ToolbarButton label="Heading 2" active={activeState?.heading2} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="size-4" /></ToolbarButton>
              <span className="mx-1 h-6 w-px bg-zinc-200" />
              <ToolbarButton label="Bold" active={activeState?.bold} onClick={() => editor?.chain().focus().toggleBold().run()}><Bold className="size-4" /></ToolbarButton>
              <ToolbarButton label="Italic" active={activeState?.italic} onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic className="size-4" /></ToolbarButton>
              <ToolbarButton label="Strikethrough" active={activeState?.strike} onClick={() => editor?.chain().focus().toggleStrike().run()}><Strikethrough className="size-4" /></ToolbarButton>
              <ToolbarButton label="Set link" active={activeState?.link} onClick={setLink}><Link2 className="size-4" /></ToolbarButton>
              <ToolbarButton label="Remove link" disabled={!activeState?.link} onClick={() => editor?.chain().focus().unsetLink().run()}><Unlink className="size-4" /></ToolbarButton>
              <span className="mx-1 h-6 w-px bg-zinc-200" />
              <ToolbarButton label="Bulleted list" active={activeState?.bulletList} onClick={() => editor?.chain().focus().toggleBulletList().run()}><List className="size-4" /></ToolbarButton>
              <ToolbarButton label="Numbered list" active={activeState?.orderedList} onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered className="size-4" /></ToolbarButton>
              <ToolbarButton label="To-do list" active={activeState?.taskList} onClick={() => editor?.chain().focus().toggleTaskList().run()}><CheckSquare className="size-4" /></ToolbarButton>
              <ToolbarButton label="Toggle list" active={activeState?.details} onClick={() => editor?.chain().focus().setDetails().run()}><ChevronRight className="size-4" /></ToolbarButton>
              <ToolbarButton label="Quote" active={activeState?.blockquote} onClick={() => editor?.chain().focus().toggleBlockquote().run()}><Quote className="size-4" /></ToolbarButton>
              <ToolbarButton label="Code block" active={activeState?.codeBlock} onClick={() => editor?.chain().focus().toggleCodeBlock().run()}><Code2 className="size-4" /></ToolbarButton>
              <ToolbarButton label="Divider" onClick={() => editor?.chain().focus().setHorizontalRule().run()}><Minus className="size-4" /></ToolbarButton>
              <ToolbarButton label="Image" onClick={insertImage}><ImageIcon className="size-4" /></ToolbarButton>
              <ToolbarButton label="Video" onClick={insertVideo}><VideoIcon className="size-4" /></ToolbarButton>
              <ToolbarButton label="Audio" onClick={insertAudio}><AudioLines className="size-4" /></ToolbarButton>
              <ToolbarButton label="Emoji" onClick={() => {
                setSlashMenuPosition({ left: Math.max(12, window.innerWidth / 2 - 180), top: 140 });
                setEmojiPickerOpen(true);
              }}><Smile className="size-4" /></ToolbarButton>
              <span className="mx-1 h-6 w-px bg-zinc-200" />
              <ToolbarButton label="Undo" disabled={!activeState?.canUndo} onClick={() => editor?.chain().focus().undo().run()}><Undo2 className="size-4" /></ToolbarButton>
              <ToolbarButton label="Redo" disabled={!activeState?.canRedo} onClick={() => editor?.chain().focus().redo().run()}><Redo2 className="size-4" /></ToolbarButton>
              <span className="ml-2 text-sm text-zinc-400">Type <span className="font-sans text-zinc-600">/</span> for commands</span>
            </div>

            {slashMenuOpen ? (
              <div style={slashMenuPosition} className="fixed z-40 w-[min(520px,calc(100vw-3rem))] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_24px_70px_rgba(24,24,27,0.18)]">
                <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
                  <span className="truncate font-sans text-sm text-zinc-700">/{slashSearch}</span>
                  <span className="shrink-0 text-xs text-zinc-400">Type to filter · Enter to select</span>
                </div>
                <div className="command-menu-scrollbar max-h-80 overflow-auto p-2">
                  {visibleSlashCommands.length ? visibleSlashCommands.map((command, index) => (
                    <button key={command.label} type="button" onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setSelectedSlashIndex(index)} onClick={command.run} className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-xl px-3 py-3 text-left ${index === selectedSlashIndex ? "bg-zinc-100 text-zinc-950" : "hover:bg-zinc-50"}`}>
                      <span><span className="block font-medium">{command.label}</span><span className="block text-sm text-zinc-400">{command.hint}</span></span><span className="font-sans text-sm text-zinc-400">{command.shortcut}</span>
                    </button>
                  )) : <p className="px-3 py-6 text-sm text-zinc-500">No commands found.</p>}
                </div>
              </div>
            ) : null}

            {emojiPickerOpen ? (
              <div style={slashMenuPosition} className="fixed z-40 w-80 rounded-2xl border border-zinc-200 bg-white p-3 shadow-[0_24px_70px_rgba(24,24,27,0.18)]">
                <div className="mb-2 flex items-center justify-between px-1"><p className="text-sm font-semibold text-zinc-700">Choose an emoji</p><button type="button" onClick={() => { setEmojiPickerOpen(false); editor?.commands.focus(); }} aria-label="Close emoji picker"><X className="size-4 text-zinc-400" /></button></div>
                <div className="grid grid-cols-6 gap-1">
                  {emojiChoices.map((choice) => (
                    <button key={choice.shortcode} type="button" title={choice.label} aria-label={choice.label} onClick={() => { editor?.chain().focus().insertContent(choice.emoji).run(); setEmojiPickerOpen(false); }} className="flex size-11 items-center justify-center rounded-xl text-2xl hover:bg-zinc-100">{choice.emoji}</button>
                  ))}
                </div>
                <p className="mt-2 px-1 text-xs text-zinc-400">Tip: type <span className="font-sans">:smile:</span> for TipTap emoji shortcuts.</p>
              </div>
            ) : null}

            <ContextMenu className="block">
              <EditorContent editor={editor} />
              {editor ? <ContextMenuContent>
                <ContextMenuItem onClick={() => editor.chain().focus().toggleBold().run()} shortcut="⌘B"><Bold className="size-4" /> Bold</ContextMenuItem>
                <ContextMenuItem onClick={() => editor.chain().focus().toggleItalic().run()} shortcut="⌘I"><Italic className="size-4" /> Italic</ContextMenuItem>
                <ContextMenuItem onClick={() => editor.chain().focus().toggleUnderline().run()} shortcut="⌘U"><Underline className="size-4" /> Underline</ContextMenuItem>
                <ContextMenuItem onClick={() => editor.chain().focus().toggleStrike().run()} shortcut="⌘⇧S"><Strikethrough className="size-4" /> Strikethrough</ContextMenuItem>
                <ContextMenuItem onClick={() => editor.chain().focus().toggleCode().run()} shortcut="⌘E"><Code2 className="size-4" /> Inline code</ContextMenuItem>
                <ContextMenuItem onClick={setLink} shortcut="⌘K"><Link2 className="size-4" /> Add link</ContextMenuItem>
                <ContextMenuItem separator />
                <ContextMenuItem onClick={() => editor.chain().focus().setParagraph().run()}><Pilcrow className="size-4" /> Turn into text</ContextMenuItem>
                <ContextMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="size-4" /> Turn into heading 1</ContextMenuItem>
                <ContextMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="size-4" /> Turn into heading 2</ContextMenuItem>
                <ContextMenuItem onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="size-4" /> Turn into bullet list</ContextMenuItem>
                <ContextMenuItem onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="size-4" /> Turn into numbered list</ContextMenuItem>
                <ContextMenuItem separator />
                <ContextMenuItem onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}><X className="size-4" /> Clear formatting</ContextMenuItem>
              </ContextMenuContent> : null}
            </ContextMenu>
          </div>
        </div>
      </section>

    </main>
  );
}
