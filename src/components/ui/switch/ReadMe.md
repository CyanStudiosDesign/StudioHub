# Switch

A simple toggle switch component with a text label. Clicking the switch flips between an on and off state with a smooth animated transition.

## Import

```tsx
import Switch from "@/components/ui/switch/Switch";
```

## Basic Usage

```tsx
<Switch switchText="Dark Mode" />
```

## With Different Labels

Pass any string as `switchText` to describe what the switch controls.

```tsx
<Switch switchText="Enable Notifications" />
<Switch switchText="Auto Save" />
<Switch switchText="Show Preview" />
```

## Props

## Switch

| Prop         | Type     | Default  | Description                                 |
| ------------ | -------- | -------- | ------------------------------------------- |
| `switchText` | `string` | Required | Label displayed to the right of the switch. |

## On vs Off

The switch manages its own on/off state internally. The visual appearance changes based on the current state.

```tsx
// Off state — subtle track with border, canvas knob on the left
// On state  — primary track, primary-fg knob shifted to the right
```

Both states use a `200ms ease-in-out` transition for the track color and knob position.

## Styling

The component uses design tokens from `globals.css`, such as:

- `--color-fg`
- `--color-canvas`
- `--color-subtle`
- `--color-border`
- `--color-primary`
- `--color-primary-fg`

The track is always `h-7 w-12` and the knob is `w-5 h-5`. Both are fully circular via `rounded-full`.

```tsx
// Off — subtle track with border, canvas knob on the left
bg-[var(--color-subtle)] border border-[var(--color-border)] // track
bg-[var(--color-canvas)] left-1 shadow-sm // knob

// On — primary track, primary-fg knob on the right
bg-[var(--color-primary)] // track
bg-[var(--color-primary-fg)] left-6 // knob
```

## Notes

- `Switch` is a `"use client"` component and must run in the browser.
- The toggle state is managed internally via `useState`. There is no `checked` or `onChange` prop — extend the component if you need to control state from outside.
- The switch is implemented as a `<button>` element and supports keyboard interaction and `focus-ring-visible` for accessibility.
- `switchText` is not tied to the toggle state — it is always visible regardless of whether the switch is on or off.
