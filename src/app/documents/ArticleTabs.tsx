"use client";

import { useRouter } from "next/navigation";
import { Tabs } from "@/components/blocks/tabs/Tabs";
import { TabsList } from "@/components/blocks/tabs/TabsList";
import { TabsTrigger } from "@/components/blocks/tabs/TabsTrigger";

export function ArticleTabs({ activeTab }: { activeTab: "all" | "workspace" }) {
  const router = useRouter();

  return (
    <Tabs defaultValue={activeTab}>
      <TabsList className="my-4 rounded-full border border-border bg-subtle p-1">
        <TabsTrigger
          value="all"
          className="rounded-full px-5"
          onClick={() => router.push("/documents?tab=all")}
        >
          All
        </TabsTrigger>
        <TabsTrigger
          value="workspace"
          className="rounded-full px-5"
          onClick={() => router.push("/documents?tab=workspace")}
        >
          Workspace
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
