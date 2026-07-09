import { readFile } from "node:fs/promises";
import path from "node:path";
import { MarkdownArticle } from "./markdown-renderer";

type MarkdownBlogPageProps = {
  filePath: string;
};

function resolveMarkdownPath(filePath: string) {
  const docsRoot = path.join(process.cwd(), "src", "doc");
  const normalizedPath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, "");

  return path.join(docsRoot, normalizedPath);
}

export default async function MarkdownBlogPage({
  filePath,
}: MarkdownBlogPageProps) {
  const markdown = await readFile(resolveMarkdownPath(filePath), "utf8");

  return <MarkdownArticle markdown={markdown} />;
}
