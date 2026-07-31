# Select

A compound dropdown select component with a trigger button, floating panel, grouped options, and click-outside to close. The selected value is displayed in the trigger and updated on item click.

## Import

```tsx
import { Select } from "@/components/ui/select/Select";
import { SelectGroup } from "@/components/ui/select/SelectGroup";
import { SelectItem } from "@/components/ui/select/SelectItems";
```

## Basic Usage

```tsx
<Select title="Select a fruit">
  <SelectGroup title="Fruits">
    <SelectItem>Apple</SelectItem>
    <SelectItem>Mango</SelectItem>
    <SelectItem>Banana</SelectItem>
  </SelectGroup>
</Select>
```

## With Multiple Groups

Use `showDivider` to render a separator between groups.

```tsx
<Select title="Select an option">
  <SelectGroup title="Fruits" showDivider>
    <SelectItem>Apple</SelectItem>
    <SelectItem>Mango</SelectItem>
  </SelectGroup>
  <SelectGroup title="Vegetables">
    <SelectItem>Carrot</SelectItem>
    <SelectItem>Spinach</SelectItem>
  </SelectGroup>
</Select>
```

## Props

## Select

| Prop       | Type        | Default  | Description                                                               |
| ---------- | ----------- | -------- | ------------------------------------------------------------------------- |
| `title`    | `string`    | Required | Placeholder text shown in the trigger button before any item is selected. |
| `children` | `ReactNode` | Required | One or more `SelectGroup` components.                                     |

## SelectGroup

| Prop          | Type                      | Default  | Description                                      |
| ------------- | ------------------------- | -------- | ------------------------------------------------ |
| `title`       | `string`                  | Required | Section label shown above the group's items.     |
| `children`    | `ReactNode`               | Required | One or more `SelectItem` components.             |
| `showDivider` | `boolean`                 | `false`  | Renders a horizontal divider below the group.    |
| `onSelect`    | `(value: string) => void` | —        | Auto-injected by `Select`. Do not pass manually. |

## SelectItem

| Prop       | Type                      | Default  | Description                                                         |
| ---------- | ------------------------- | -------- | ------------------------------------------------------------------- |
| `children` | `ReactNode`               | Required | Display label — also the value passed up when the item is selected. |
| `onSelect` | `(value: string) => void` | —        | Auto-injected by `SelectGroup`. Do not pass manually.               |

## Open and Close Behavior

The dropdown opens when the trigger button is clicked and closes in two ways — selecting an item, or clicking anywhere outside the component.

```tsx
// Opens on trigger click
<button onClick={() => setOpen(!open)}>...</button>;

// Closes on item select
function handleSelect(value: string) {
  setSelected(value);
  setOpen(false);
}

// Closes on click outside via mousedown listener
document.addEventListener("mousedown", handleClickOutside);
```

The `ChevronDown` icon rotates 180° when the dropdown is open.

## How `onSelect` Flows

`onSelect` is set once inside `Select` and injected downward via `React.cloneElement` — you never need to pass it to groups or items manually.

```
<Select title="...">                    // owns handleSelect
  └── cloneElement → SelectGroup        // receives onSelect
        └── cloneElement → SelectItem   // receives onSelect
              └── onClick → onSelect(children)
```

## Styling

The component uses design tokens from `globals.css`, such as:

- `--color-surface`
- `--color-border`
- `--color-fg`
- `--color-fg-muted`
- `--color-fg-subtle`
- `--color-subtle`
- `--shadow-sm`, `--shadow-2xl`

The trigger button is always `w-full max-w-sm h-11`. The dropdown panel is `max-h-60` with internal scroll for overflow content.

```tsx
// To change the max width of the select
<div className="relative flex w-full max-w-sm ...">

// To change the max height of the dropdown panel
<div className="... max-h-60 overflow-y-auto ...">
```

## Notes

- All components are `"use client"` and must run in the browser.
- `SelectGroup` and `SelectItem` must be rendered inside a `<Select>` — `onSelect` is injected via `cloneElement` and won't work outside.
- `cloneElement` uses `child: any` to inject props, which bypasses TypeScript prop checks on children. Use a context-based approach if stricter typing is needed.
- Selected value state is managed internally by `Select`. There is no controlled `value` or `onChange` prop — extend the component if you need to read the selected value from outside.
- `lucide-react` is required for the `ChevronDown` icon in the trigger button.
- The `cn()` utility from `@/lib/utils` is required.
