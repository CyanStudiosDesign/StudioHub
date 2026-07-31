# Dialog

A simple modal dialog system made up of two components. `DialogUi` manages open/close state and renders the trigger button. `ModalUi` renders the modal overlay with a form inside.

## Import

```tsx
import DialogUi from "@/components/ui/dialog/DialogUi";
import ModalUi from "@/components/ui/dialog/ModalUi";
```

## Basic Usage

Use `DialogUi` when you want a self-contained dialog with a trigger button already included.

```tsx
<DialogUi />
```

Use `ModalUi` directly when you want to control visibility yourself.

```tsx
{
  isOpen && <ModalUi handleClose={() => setIsOpen(false)} />;
}
```

## Controlled Usage

If you need to trigger the modal from outside the component, manage `isOpen` state yourself and conditionally render `ModalUi`.

```tsx
const [isOpen, setIsOpen] = useState(false);

return (
  <>
    <button onClick={() => setIsOpen(true)}>Open Dialog</button>
    {isOpen && <ModalUi handleClose={() => setIsOpen(false)} />}
  </>
);
```

## Props

## DialogUi

`DialogUi` takes no props. It manages its own open/close state and includes a trigger button.

## ModalUi

| Prop          | Type         | Default  | Description                                                                 |
| ------------- | ------------ | -------- | --------------------------------------------------------------------------- |
| `handleClose` | `() => void` | Required | Callback fired when the overlay, close button, or Cancel button is clicked. |

## Close Behavior

The modal can be closed in three ways — clicking the backdrop overlay, the `X` icon button in the header, or the Cancel button in the footer. All three call the same `handleClose` callback passed in by the parent.

```tsx
// Backdrop overlay — clicking anywhere outside the modal card
<div className="fixed inset-0 ..." onClick={handleClose}>

// X button — top right of the modal
<button onClick={handleClose}>
  <X size={20} />
</button>

// Cancel button — bottom right of the footer
<button onClick={handleClose}>Cancel</button>
```

Click events on the modal card itself are stopped from bubbling up to the overlay using `e.stopPropagation()`, so interacting with the form does not accidentally close the modal.

## Styling

The component uses design tokens from `globals.css`, such as:

- `--color-fg`
- `--color-fg-muted`
- `--color-fg-inverse`
- `--color-surface`
- `--color-canvas`
- `--color-subtle`
- `--color-primary`
- `--color-primary-hover`
- `--color-border`
- `--color-border-strong`
- `--radius-lg`, `--radius-md`
- `--shadow-md`

To change the modal width, update `max-w-[400px]` on the inner container.

```tsx
// Default width
<div className="w-full max-w-[400px] ...">

// Wider modal
<div className="w-full max-w-[600px] ...">
```

## Notes

- `DialogUi` is a `"use client"` component and must run in the browser.
- `ModalUi` is a presentational component but must be used inside a `"use client"` boundary since it receives a callback prop.
- The modal is rendered using `fixed inset-0`, so it overlays the entire viewport regardless of where it is placed in the tree.
- The Save changes button has no `onClick` handler by default — wire it up to your own submit logic.
- `ModalUi` contains a Name and Username field. These are uncontrolled inputs with no state — manage them yourself if you need their values.
- `lucide-react` is required for the `X` close icon used in `ModalUi`.
