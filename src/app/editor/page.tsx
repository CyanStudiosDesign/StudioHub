import type { Metadata } from "next";
import MarkdownEditor from "@/editor/MarkdownEditor";

export const metadata: Metadata = {
  title: "Markdown Editor | Studio Hub",
  description: "A Notion-inspired live Markdown editor",
};

export default function EditorPage() {
  return <MarkdownEditor />;
}
