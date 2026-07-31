# Dropdown Component

A fully composable, accessible, and design-system-friendly Dropdown Menu component built with React, TypeScript, Next.js, and Tailwind CSS.

Unlike traditional monolithic dropdown implementations, this component follows a compound component architecture, allowing developers to compose menus using small reusable building blocks.

---

# Features

* Compound Component Architecture
* Context-based State Management
* Nested Submenus
* Keyboard Escape Support
* Click Outside Detection
* Navigation & Action Items
* Custom Labels
* Menu Separators
* Keyboard Shortcut Indicators
* Accessibility Support
* Design System Integration

---

# Architecture Overview

The dropdown is built using React Context.

```tsx
<Dropdown>
  <DropdownTrigger />
  <DropdownContent />
</Dropdown>
```

The provider manages the dropdown state and distributes it to all child components through context.

Benefits:

* No prop drilling
* Clean component composition
* Reusable architecture
* Easy scalability

---

# Installation

No external dropdown library is required.

Dependencies:

```bash
npm install react next
```

---

# Import

```tsx
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownLabel,
  DropdownItem,
  DropdownShortcut,
  DropdownSeparator,
  DropdownSub,
} from "@/components/ui/dropdown";
```

---

# Basic Usage

```tsx
<Dropdown>
  <DropdownTrigger>
    Open Menu
  </DropdownTrigger>

  <DropdownContent>
    <DropdownItem>
      Profile
    </DropdownItem>

    <DropdownItem>
      Settings
    </DropdownItem>
  </DropdownContent>
</Dropdown>
```

---

# Complete Example

```tsx
<Dropdown>
  <DropdownTrigger>
    Account
  </DropdownTrigger>

  <DropdownContent>

    <DropdownLabel>
      My Account
    </DropdownLabel>

    <DropdownItem href="/profile">
      Profile
    </DropdownItem>

    <DropdownItem href="/settings">
      Settings
      <DropdownShortcut>⌘S</DropdownShortcut>
    </DropdownItem>

    <DropdownSeparator />

    <DropdownSub label="Team">
      <DropdownItem>
        Members
      </DropdownItem>

      <DropdownItem>
        Permissions
      </DropdownItem>
    </DropdownSub>

    <DropdownSeparator />

    <DropdownItem>
      Logout
    </DropdownItem>

  </DropdownContent>
</Dropdown>
```

---

# Components

## Dropdown

Main provider component.

Responsibilities:

* Stores open/close state
* Handles click outside detection
* Handles Escape key closing
* Provides dropdown context

Example:

```tsx
<Dropdown>
  ...
</Dropdown>
```

---

## DropdownTrigger

Controls menu visibility.

Example:

```tsx
<DropdownTrigger>
  Actions
</DropdownTrigger>
```

Features:

* Toggle open state
* Accessibility attributes
* Design-system styling

Automatically adds:

```tsx
aria-expanded
aria-haspopup
```

---

## DropdownContent

Menu container.

Example:

```tsx
<DropdownContent>
  ...
</DropdownContent>
```

Responsibilities:

* Conditionally renders menu
* Positions dropdown
* Applies elevation and styling

Behavior:

Returns null when menu is closed.

```tsx
if (!isOpen) return null;
```

This improves performance by avoiding unnecessary DOM rendering.

---

## DropdownLabel

Non-interactive section header.

Example:

```tsx
<DropdownLabel>
  Account
</DropdownLabel>
```

Use Cases:

* Grouping menu sections
* Categorizing actions
* Improving menu readability

---

## DropdownItem

Interactive menu item.

Supports:

* Navigation
* Actions
* Event handlers

Navigation:

```tsx
<DropdownItem href="/profile">
  Profile
</DropdownItem>
```

Action:

```tsx
<DropdownItem onClick={handleDelete}>
  Delete
</DropdownItem>
```

Behavior:

* Executes callback
* Closes dropdown automatically

---

## DropdownShortcut

Displays keyboard shortcuts.

Example:

```tsx
<DropdownShortcut>
  ⌘K
</DropdownShortcut>
```

Output:

```text
Search                    ⌘K
```

Use Cases:

* Power-user interfaces
* Productivity applications
* Desktop-like menus

---

## DropdownSeparator

Visual divider.

Example:

```tsx
<DropdownSeparator />
```

Purpose:

* Separate menu groups
* Improve scanning
* Reduce visual clutter

---

## DropdownSub

Nested submenu component.

Example:

```tsx
<DropdownSub label="Team">
  <DropdownItem>
    Members
  </DropdownItem>

  <DropdownItem>
    Roles
  </DropdownItem>
</DropdownSub>
```

Features:

* Nested menu support
* Hover activation
* Click activation
* Independent state management

---

# Multiple Usage Patterns

## Navigation Menu

```tsx
<Dropdown>
  <DropdownTrigger>
    Navigation
  </DropdownTrigger>

  <DropdownContent>
    <DropdownItem href="/">
      Home
    </DropdownItem>

    <DropdownItem href="/products">
      Products
    </DropdownItem>

    <DropdownItem href="/about">
      About
    </DropdownItem>
  </DropdownContent>
</Dropdown>
```

---

## User Profile Menu

```tsx
<Dropdown>
  <DropdownTrigger>
    John Doe
  </DropdownTrigger>

  <DropdownContent>

    <DropdownLabel>
      Account
    </DropdownLabel>

    <DropdownItem href="/profile">
      Profile
    </DropdownItem>

    <DropdownItem href="/billing">
      Billing
    </DropdownItem>

    <DropdownSeparator />

    <DropdownItem>
      Logout
    </DropdownItem>

  </DropdownContent>
</Dropdown>
```

---

## Dashboard Actions

```tsx
<Dropdown>
  <DropdownTrigger>
    Actions
  </DropdownTrigger>

  <DropdownContent>

    <DropdownItem>
      Edit
    </DropdownItem>

    <DropdownItem>
      Duplicate
    </DropdownItem>

    <DropdownItem>
      Archive
    </DropdownItem>

    <DropdownSeparator />

    <DropdownItem>
      Delete
    </DropdownItem>

  </DropdownContent>
</Dropdown>
```

---

# Accessibility

The component includes:

```tsx
aria-expanded
aria-haspopup
role="menu"
role="menuitem"
```

Benefits:

* Screen reader support
* Better semantic structure
* Improved keyboard usability
* Disabled feature added 

---

# State Management Analysis

Main dropdown state:

```tsx
const [isOpen, setIsOpen] = useState(false);
```

Submenu state:

```tsx
const [isSubOpen, setIsSubOpen] = useState(false);
```

Advantages:

* Isolated state updates
* Independent submenu behavior
* Clean architecture

---

# Click Outside Detection

The component automatically closes when users click outside.

Implementation:

```tsx
containerRef.current.contains(...)
```

Benefits:

* Better UX
* Expected dropdown behavior
* Prevents stale open menus

---

# Escape Key Support

The dropdown listens for:

```tsx
Escape
```

Behavior:

```tsx
if (event.key === "Escape")
```

Result:

* Menu closes instantly
* Improved accessibility
* Better keyboard navigation

---

# Design System Integration

Uses semantic design tokens:

```txt
bg-surface
bg-subtle
border-border
text-fg
text-fg-muted
focus-ring-visible
```

Benefits:

* Dark mode support
* Theme scalability
* Consistent UI language
* Responsive

---