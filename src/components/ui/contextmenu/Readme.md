# ContextMenu

A lightweight, accessible right-click context menu built with React. Composed of three primitives — `ContextMenu`, `ContextMenuContent`, and `ContextMenuItem` — that work together to render a positioned menu on right-click.

---

## Components

### `ContextMenu`

The root wrapper. Listens for right-click events and manages open/close state.

```tsx
import { ContextMenu } from "@/components/ContextMenu";

<ContextMenu>
  {/* Trigger content and ContextMenuContent go here */}
</ContextMenu>;
```

**Props**

| Prop       | Type              | Description                         |
| ---------- | ----------------- | ----------------------------------- |
| `children` | `React.ReactNode` | Trigger area content + menu content |

**Behavior**

- Right-clicking anywhere inside the wrapper opens the menu at the cursor position.
- Clicking anywhere on the page closes the menu.
- Automatically injects `x` and `y` coordinates into any `ContextMenuContent` child.

---

### `ContextMenuContent`

The floating menu container. Rendered at a fixed position based on where the right-click occurred.

```tsx
import { ContextMenuContent } from "@/components/ContextMenuContent";

<ContextMenuContent>{/* ContextMenuItems go here */}</ContextMenuContent>;
```

**Props**

| Prop       | Type              | Default | Description                              |
| ---------- | ----------------- | ------- | ---------------------------------------- |
| `children` | `React.ReactNode` | —       | Menu items to render inside the menu     |
| `x`        | `number`          | `0`     | Horizontal position (injected by parent) |
| `y`        | `number`          | `0`     | Vertical position (injected by parent)   |

> **Note:** `x` and `y` are injected automatically by `ContextMenu`. You don't need to pass them manually.

---

### `ContextMenuItem`

An individual menu item. Can render as a clickable button, a disabled button, or a visual separator.

```tsx
import { ContextMenuItem } from "@/components/ContextMenuItem";

<ContextMenuItem>Open</ContextMenuItem>
<ContextMenuItem disabled>Rename</ContextMenuItem>
<ContextMenuItem separator />
<ContextMenuItem>Delete</ContextMenuItem>
```

**Props**

| Prop        | Type              | Default | Description                                        |
| ----------- | ----------------- | ------- | -------------------------------------------------- |
| `children`  | `React.ReactNode` | —       | Label content for the menu item                    |
| `separator` | `boolean`         | `false` | Renders a horizontal divider instead of a button   |
| `disabled`  | `boolean`         | `false` | Renders the item in a muted, non-interactive state |

---

## Usage Example

```tsx
import { ContextMenu } from "@/components/ContextMenu";
import { ContextMenuContent } from "@/components/ContextMenuContent";
import { ContextMenuItem } from "@/components/ContextMenuItem";

export default function App() {
  return (
    <ContextMenu>
      <span>Right-click anywhere in this area</span>

      <ContextMenuContent>
        <ContextMenuItem>Open</ContextMenuItem>
        <ContextMenuItem>Copy</ContextMenuItem>
        <ContextMenuItem separator />
        <ContextMenuItem disabled>Paste</ContextMenuItem>
        <ContextMenuItem separator />
        <ContextMenuItem>Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
```

---

## File Structure

```
components/
├── ContextMenu.tsx         # Root wrapper — handles event detection and state
├── ContextMenuContent.tsx  # Floating container — renders at cursor position
└── ContextMenuItem.tsx     # Individual item — button, disabled state, or separator
```

---

## Styling

Components use Tailwind CSS utility classes and reference the following CSS variables from your design system:

| Variable    | Usage                    |
| ----------- | ------------------------ |
| `border`    | Menu and item borders    |
| `surface`   | Menu background          |
| `fg`        | Default item text color  |
| `fg-subtle` | Disabled item text color |
| `subtle`    | Item hover background    |
| `disabled`  | Disabled item background |

---

## Notes

- The `ContextMenu` wrapper renders with `aspect-2/1` and `max-w-md` by default — adjust these classes to fit your layout.
- The menu closes on any left-click via a global `window` event listener.
- Clicking inside `ContextMenuContent` stops click propagation to prevent the menu from immediately closing after opening.
