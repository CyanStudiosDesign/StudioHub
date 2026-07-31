# Button

A simple button component for triggering actions. It supports multiple visual variants, sizes, hover states, active states, and disabled states.

## Import

```tsx
import { Button } from "@/components/ui/buttons/Buttons";
```

## Basic Usage

```tsx
<Button>Primary</Button>

<Button variant="outline">
  Outline
</Button>

<Button variant="danger">
  Delete
</Button>
```

## Variants

Use `variant` to control the button style.

```tsx
<Button>Primary</Button>

<Button variant="outline">
  Outline
</Button>

<Button variant="ghost">
  Ghost
</Button>

<Button variant="subtle">
  Subtle
</Button>

<Button variant="danger">
  Danger
</Button>

<Button variant="info">
  Info
</Button>

<Button variant="success">
  Success
</Button>

<Button variant="warning">
  Warning
</Button>

<Button variant="link">
  Link
</Button>
```

## Sizes

Use `size` to control the button height, padding, and text size.

```tsx
<Button size="sm">
  Small
</Button>

<Button size="md">
  Medium
</Button>

<Button size="lg">
  Large
</Button>

<Button size="icon">
  +
</Button>
```

## Disabled State

Use the normal `disabled` prop to disable the button.

```tsx
<Button disabled>
  Disabled
</Button>

<Button variant="outline" disabled>
  Disabled Outline
</Button>

<Button variant="danger" disabled>
  Disabled Danger
</Button>
```

## Props

### Button

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | Required | The button content to render. |
| `variant` | `ButtonVariant` | `"primary"` | Controls the visual style of the button. |
| `size` | `ButtonSize` | `"md"` | Controls the button size. |
| `className` | `string` | `undefined` | Adds custom classes to the button. |
| `disabled` | `boolean` | `false` | Disables the button. |

`Button` also accepts normal button props like `type`, `id`, `aria-label`, `onClick`, `name`, and `disabled`.

### ButtonVariant

| Variant | Description |
|---|---|
| `primary` | Main action button. |
| `outline` | Neutral bordered button. |
| `ghost` | Minimal button for low-emphasis actions. |
| `subtle` | Soft background button for secondary actions. |
| `danger` | Destructive action button. |
| `info` | Informational action button. |
| `success` | Positive confirmation button. |
| `warning` | Cautionary action button. |
| `link` | Text-style button that looks like a link. |

### ButtonSize

| Size | Description |
|---|---|
| `sm` | Small button for compact layouts. |
| `md` | Default button size. |
| `lg` | Large button for stronger emphasis. |
| `icon` | Square button for icons or short symbols. |

## Variant Examples

Use `primary` for the main action on a page or section.

```tsx
<Button>
  Save Changes
</Button>
```

Use `outline`, `ghost`, or `subtle` for secondary actions.

```tsx
<Button variant="outline">
  Cancel
</Button>

<Button variant="ghost">
  Back
</Button>

<Button variant="subtle">
  View Details
</Button>
```

Use `danger` for destructive actions.

```tsx
<Button variant="danger">
  Delete Account
</Button>
```

Use semantic variants for status-related actions.

```tsx
<Button variant="success">
  Approve
</Button>

<Button variant="warning">
  Review
</Button>

<Button variant="info">
  Learn More
</Button>
```

## Icon Buttons

Use `size="icon"` for icon-only buttons.

```tsx
<Button
  size="icon"
  aria-label="Close dialog"
>
  ✕
</Button>
```

Always provide an accessible label using `aria-label` when the button does not contain visible text.

## Styling

The button uses the design tokens from `globals.css`, such as:

- `bg-primary`
- `bg-primary-hover`
- `bg-subtle`
- `bg-surface`
- `bg-canvas`
- `bg-disabled`
- `text-fg`
- `text-fg-muted`
- `text-fg-subtle`
- `text-fg-inverse`
- `text-primary`
- `border-border`
- `border-primary`
- `border-danger`
- `border-info`
- `border-success`
- `border-warning`
- `focus-ring-visible`

You can customize the look by passing `className`.

```tsx
<Button className="w-full">
  Full Width
</Button>

<Button
  variant="outline"
  className="border-primary text-primary"
>
  Custom Outline
</Button>
```

## Notes

- Use `primary` for the main action on a page or section.
- Use `outline`, `ghost`, or `subtle` for secondary actions.
- Use `danger` only for destructive actions such as delete or remove.
- Use `success`, `warning`, and `info` for semantic actions.
- Use `size="icon"` for icon-only buttons.
- Always provide an `aria-label` for icon-only buttons.
- Custom styles can be applied using the `className` prop.
- The component supports all standard HTML button attributes.