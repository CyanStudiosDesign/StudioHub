# Tabs

A reusable Tabs component built with React, TypeScript, and Tailwind CSS using the Compound Component Pattern and Context API.

The component is split into multiple building blocks, allowing you to create flexible and maintainable tab interfaces while keeping state management centralized.

## Preview

```txt
┌─────────────────────────────────────┐
│ Overview │ Analytics │ Reports │ Settings │
└─────────────────────────────────────┘

Overview

Track performance and user engagement metrics.
Monitor trends and identify growth opportunities.
Page views are up 25% compared to last month.
```

---

## File Structure

```txt
tabs/
├── Tabs.tsx
├── TabsContext.tsx
├── TabsList.tsx
├── TabsTrigger.tsx
├── TabsContent.tsx
├── TabsDemo.tsx
└── README.md
```

---

## Features

* Compound Component Pattern
* Context API based state management
* Fully composable architecture
* TypeScript support
* Tailwind CSS styling
* Active tab state synchronization
* Customizable content sections
* Reusable across applications

---

## Installation

Copy the `tabs` folder into your project.

```txt
src/
└── components/
    └── blocks/
        └── tabs/
            ├── Tabs.tsx
            ├── TabsContext.tsx
            ├── TabsList.tsx
            ├── TabsTrigger.tsx
            ├── TabsContent.tsx
            ├── TabsDemo.tsx
            └── README.md
```

---

## Basic Usage

```tsx
import { Tabs } from "./Tabs";
import { TabsList } from "./TabsList";
import { TabsTrigger } from "./TabsTrigger";
import { TabsContent } from "./TabsContent";

export default function Example() {
  return (
    <Tabs defaultValue="profile">
      <TabsList>
        <TabsTrigger value="profile">
          Profile
        </TabsTrigger>

        <TabsTrigger value="settings">
          Settings
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        Profile Content
      </TabsContent>

      <TabsContent value="settings">
        Settings Content
      </TabsContent>
    </Tabs>
  );
}
```

---

## Complete Example

```tsx
<Tabs defaultValue="overview">

  <TabsList>
    <TabsTrigger value="overview">
      Overview
    </TabsTrigger>

    <TabsTrigger value="analytics">
      Analytics
    </TabsTrigger>

    <TabsTrigger value="reports">
      Reports
    </TabsTrigger>

    <TabsTrigger value="settings">
      Settings
    </TabsTrigger>
  </TabsList>

  <TabsContent value="overview">
    Overview Content
  </TabsContent>

  <TabsContent value="analytics">
    Analytics Content
  </TabsContent>

  <TabsContent value="reports">
    Reports Content
  </TabsContent>

  <TabsContent value="settings">
    Settings Content
  </TabsContent>

</Tabs>
```

---

## Components

### Tabs

Root component responsible for managing tab state and providing context.

| Prop         | Type      |
| ------------ | --------- |
| children     | ReactNode |
| defaultValue | string    |

---

### TabsList

Container that groups all tab triggers.

| Prop     | Type      |
| -------- | --------- |
| children | ReactNode |

---

### TabsTrigger

Interactive tab button used to switch between tabs.

| Prop     | Type      |
| -------- | --------- |
| children | ReactNode |
| value    | string    |

---

### TabsContent

Displays content associated with the active tab.

| Prop     | Type      |
| -------- | --------- |
| children | ReactNode |
| value    | string    |

---

## Context API

The component uses React Context to share tab state between child components.

```tsx
<TabsContext.Provider
  value={{
    activeTab,
    setActiveTab,
  }}
>
```

This allows:

* TabsTrigger to update the active tab
* TabsContent to react to state changes
* No prop drilling between components

---

## Compound Component Pattern

The Tabs component follows the Compound Component Pattern.

```tsx
<Tabs>
  <TabsList>
    <TabsTrigger />
    <TabsTrigger />
  </TabsList>

  <TabsContent />
</Tabs>
```

Benefits:

* Flexible API
* Better composition
* Improved readability
* Reusable building blocks

---

## Demo Component

The package includes a ready-to-use demo component.

```tsx
import TabsDemo from "./TabsDemo";

export default function Example() {
  return <TabsDemo />;
}
```

---

## Registry Example

```tsx
{
  id: "tabs",
  name: "Tabs",
  category: "Blocks",
  preview: <TabsDemo />,
}
```

This allows users to preview the entire Tabs component directly from the component registry.

---

## Dependencies

```tsx
import React from "react";
import { createContext } from "react";
import { useContext } from "react";
import { useState } from "react";
```

---

## Notes

* Built using the Compound Component Pattern.
* Uses React Context API for state management.
* Only the active tab content is rendered.
* Designed for component libraries and design systems.
* Easy to customize using Tailwind CSS.
* Fully typed with TypeScript.
* Suitable for dashboards, settings pages, analytics panels, and admin interfaces.
