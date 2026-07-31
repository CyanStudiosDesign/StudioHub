# Toast

A simple toast notification system made up of two components. `ToastUi` renders the visible notification, and `ToastVisibility` manages when it appears and disappears.

## Import

```tsx
import ToastUi from "@/components/ui/toast/ToastUi";
import ToastVisibility from "@/components/ui/toast/ToastVisibility";
```

## Basic Usage

Use `ToastVisibility` when you want a self-contained demo with a trigger button already included.

```tsx
<ToastVisibility />
```

Use `ToastUi` directly when you want to control visibility yourself.

```tsx
{
  showToast && <ToastUi toastMessage="Profile updated successfully!" />;
}
```

## Controlled Usage

If you need to trigger the toast from outside the component, manage `showToast` state yourself and conditionally render `ToastUi`.

```tsx
const [showToast, setShowToast] = useState(false);

const handleSave = () => {
  // do something
  setShowToast(true);
  setTimeout(() => setShowToast(false), 3000);
};

return (
  <>
    <button onClick={handleSave}>Save</button>
    {showToast && <ToastUi toastMessage="Changes saved!" />}
  </>
);
```

## Props

## ToastUi

| Prop           | Type     | Default  | Description                                  |
| -------------- | -------- | -------- | -------------------------------------------- |
| `toastMessage` | `string` | Required | The message text displayed inside the toast. |

## ToastVisibility

`ToastVisibility` takes no props. It manages its own internal state and includes a trigger button for demonstration purposes.

## Auto-dismiss Behavior

The toast dismisses itself automatically after **3 seconds**. This is handled inside `ToastVisibility` using `useEffect` and `setTimeout`. The timer is also cleaned up correctly if the component unmounts before the timeout fires.

```tsx
useEffect(() => {
  if (!showToast) return;

  const timerId = setTimeout(() => {
    setShowToast(false);
  }, 3000);

  return () => clearTimeout(timerId);
}, [showToast]);
```

## Styling

The components use design tokens from `globals.css`, such as:

- `--color-inverse`
- `--color-border`
- `--color-primary`
- `--color-fg-inverse`
- `--color-canvas`
- `--radius-lg`, `--radius-md`
- `--shadow-md`, `--shadow-sm`
- `--spacing-4`, `--spacing-8`
- `--text-sm`
- `--font-medium`

The toast is always fixed to the **top-right corner** of the viewport (`top-20 right-5 z-50`). To change its position, update the positioning classes directly in `ToastUi`.

```tsx
// Default position — top right
<div className="fixed top-20 right-5 z-50 ...">

// Example: bottom right
<div className="fixed bottom-5 right-5 z-50 ...">
```

## Notes

- `ToastUi` is a purely presentational component. It has no internal state or side effects.
- `ToastVisibility` is a `"use client"` component and must run in the browser.
- The auto-dismiss duration is hardcoded to `3000ms` in `ToastVisibility`. Extract it to a prop or constant if you need it to be configurable.
- `ToastUi` must be conditionally rendered by the parent — it has no built-in show/hide logic.
- `ToastVisibility` must be placed inside a `"use client"` boundary.
