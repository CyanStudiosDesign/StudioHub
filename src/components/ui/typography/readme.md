# Typography

A simple typography component for rendering consistent text styles. It uses the design tokens from `globals.css` for font size, color, weight, and line height.

## Import

```tsx
import { Text } from "@/components/ui/typography/Typography";
```



## Basic Usage

```tsx
<Text variant="h1">Dashboard</Text>

<Text variant="lead">
  Build clean, consistent interfaces with shared typography styles.
</Text>

<Text variant="para">
  This is normal paragraph text for body copy.
</Text>
```

## Text Variants

Use `variant` to choose the visual style and HTML tag.

```tsx
<Text variant="h1">Heading 1</Text>
<Text variant="h2">Heading 2</Text>
<Text variant="h3">Heading 3</Text>
<Text variant="h4">Heading 4</Text>
<Text variant="lead">Lead text</Text>
<Text variant="para">Paragraph text</Text>
<Text variant="muted">Muted text</Text>
<Text variant="small">Small text</Text>
<Text variant="caption">Caption text</Text>
```

## Also if you want to peek what are the variant overall it has, then use ctrl+space bar for both mac and windows

## Inline Text

Some variants can be used inside paragraph text.

```tsx
<Text variant="para">
  Run <Text variant="code">npm run dev</Text> to start the app.
</Text>

<Text variant="para">
  Press <Text variant="kbd">Cmd K</Text> to open search.
</Text>

<Text variant="para">
  This sentence has <Text variant="strong">medium emphasis</Text>.
</Text>
```

## Status Text

Use `success` and `error` for short feedback messages.

```tsx
<Text variant="success">
  Your changes were saved successfully.
</Text>

<Text variant="error">
  Something went wrong. Please try again.
</Text>
```

## Props

## Text

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | Required | The text or inline content to render. |
| `variant` | `TextVariant` | `"para"` | Controls the typography style and HTML tag. |
| `className` | `string` | `undefined` | Adds custom classes to the rendered element. |

## TextVariant

| Variant | HTML Tag | Description |
|---|---|---|
| `h1` | `h1` | Main page or section heading. |
| `h2` | `h2` | Secondary heading. |
| `h3` | `h3` | Smaller heading. |
| `h4` | `h4` | Compact heading. |
| `lead` | `p` | Larger introductory paragraph. |
| `para` | `p` | Default paragraph text. |
| `muted` | `p` | Secondary body text. |
| `small` | `small` | Small supporting text. |
| `caption` | `p` | Caption, helper text, or metadata. |
| `label` | `label` | Form or field label text. |
| `overline` | `p` | Small uppercase section label. |
| `link` | `a` | Link-styled text. |
| `code` | `code` | Inline code text. |
| `kbd` | `kbd` | Keyboard shortcut text. |
| `strong` | `strong` | Medium emphasis text. |
| `success` | `p` | Success message text. |
| `error` | `p` | Error message text. |
| `blockquote` | `blockquote` | Quoted text. |

## Heading vs Paragraph Text

Use heading variants when the text is part of the page structure.

```tsx
<Text variant="h1">Settings</Text>
<Text variant="h2">Profile</Text>
```

Use paragraph variants for normal readable text.

```tsx
<Text variant="para">
  Manage your account details and preferences.
</Text>

<Text variant="muted">
  Last updated 2 hours ago.
</Text>
```

## Styling

The typography component uses the design tokens from `globals.css`, such as:

- `text-fg`
- `text-fg-muted`
- `text-fg-subtle`
- `text-primary`
- `text-danger-strong`
- `text-success-strong`
- `bg-subtle`
- `bg-surface`
- `border-border`
- `text-xs`
- `text-sm`
- `text-base`
- `text-lg`
- `text-xl`
- `font-medium`
- `leading-tight`
- `leading-normal`

You can customize the look by passing `className` to `Text`.

```tsx
<Text variant="h2" className="text-primary">
  Custom heading
</Text>

<Text variant="muted" className="max-w-sm">
  Muted text with custom width.
</Text>
```

## Notes

- `h1`, `h2`, `h3`, and `h4` should be used for real headings.
- `lead`, `para`, `muted`, `caption`, `success`, and `error` render paragraph-style text.
- `code`, `kbd`, and `strong` can be used inside paragraphs.
- `link` renders an `a` tag, but the current component props do not include `href`.
- `label` renders a `label` tag, but the current component props do not include `htmlFor`.
- The current component accepts `children`, `variant`, and `className`.