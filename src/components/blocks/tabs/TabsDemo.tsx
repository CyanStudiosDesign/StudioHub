

"use client";

import { Tabs } from "./Tabs";
import { TabsList } from "./TabsList";
import { TabsTrigger } from "./TabsTrigger";
import { TabsContent } from "./TabsContent";



export default function Page() {
  return (
    <div className="p-10">
      <Tabs defaultValue="overview">

        <TabsList>
          <TabsTrigger value="overview">
            overview
          </TabsTrigger>

          <TabsTrigger value="analytics">
            analytics
          </TabsTrigger>

          <TabsTrigger value="reports">
            reports
          </TabsTrigger>
           <TabsTrigger value="settings">
            settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          overview
Track performance and user engagement metrics. Monitor trends and identify growth opportunities.
Page views are up 25% compared to last month.
        </TabsContent>

        <TabsContent value="analytics">
          Analytics
Track performance and user engagement metrics. Monitor trends and identify growth opportunities.
Page views are up 25% compared to last month.
        </TabsContent>

        <TabsContent value="reports">
          Reports
Generate and download your detailed reports. Export data in multiple formats for analysis.
You have 5 reports ready and available to export.
        </TabsContent>
        <TabsContent value="settings">
          Settings
Manage your account preferences and options. Customize your experience to fit your needs.
Configure notifications, security, and themes.
        </TabsContent>

      </Tabs>
    </div>
  );
}