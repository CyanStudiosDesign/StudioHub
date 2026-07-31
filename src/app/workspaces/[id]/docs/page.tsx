import { redirect } from "next/navigation";

export default function WorkspaceDocsPage() {
  redirect("/documents?tab=workspace");
}
