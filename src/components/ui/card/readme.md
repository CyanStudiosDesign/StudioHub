# Card Component

A highly composable, responsive, and design-system-friendly Card component built with React, TypeScript, and Tailwind CSS.

The component follows a compound component architecture, allowing developers to build complex card layouts using reusable building blocks while maintaining consistency across applications.

---

# Features

* Compound Component Architecture
* Multiple Card Sizes
* Multiple Visual Variants
* Vertical & Horizontal Layouts
* Card Media Support
* Hover Effects
* Pressable Cards
* Context-Based Styling
* Responsive Design
* Accessible Structure
* Design System Integration

---

# Installation

No external dependencies are required.

```bash
npm install react
```

---

# Import

```tsx
import {
  Card,
  CardMedia,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "@/components/ui/card";
```

---

# Basic Usage

```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>
      Short description goes here.
    </CardDescription>
  </CardHeader>

  <CardContent>
    Main content area.
  </CardContent>
</Card>
```

---

# Complete Example

```tsx
<Card
  size="lg"
  variant="default"
  hoverEffect="lift"
>
  <CardMedia
    src="/image.jpg"
    alt="Card Image"
  />

  <CardHeader>
    <CardTitle>
      Product Card
    </CardTitle>

    <CardDescription>
      Premium product description.
    </CardDescription>
  </CardHeader>

  <CardContent>
    Detailed content section.
  </CardContent>

  <CardFooter>
    <CardAction>
      Buy Now
    </CardAction>
  </CardFooter>
</Card>
```

---

# Card Sizes

The component supports four predefined sizes.

## Small

```tsx
<Card size="sm">
```

Best for:

* Compact layouts
* Dashboards
* Statistics cards

---

## Medium

```tsx
<Card size="md">
```

Default size.

Best for:

* General-purpose cards
* Product previews
* User profiles

---

## Large

```tsx
<Card size="lg">
```

Best for:

* Featured content
* Detailed information
* Marketing sections

---

## Extra Large

```tsx
<Card size="xl">
```

Best for:

* Hero content
* Rich media layouts
* Landing page sections

---

# Card Variants

## Default

```tsx
<Card variant="default">
```

Appearance:

* Surface background
* Border
* Shadow

---

## Bordered

```tsx
<Card variant="bordered">
```

Appearance:

* Transparent background
* Visible border
* No shadow

---

## Ghost

```tsx
<Card variant="ghost">
```

Appearance:

* No border
* No shadow
* Minimal styling

---

## Glass

```tsx
<Card variant="glass">
```

Appearance:

* Backdrop blur
* Semi-transparent background
* Modern glassmorphism effect

---

# Layout Modes

## Vertical Layout

Default layout.

```tsx
<Card layout="vertical">
```

Structure:

```text
Media
Title
Description
Content
Footer
```

---

## Horizontal Layout

```tsx
<Card layout="horizontal">
```

Structure:

```text
Image | Content
```

Best for:

* Product lists
* User cards
* Search results

---

# Hover Effects

## None

```tsx
<Card hoverEffect="none">
```

Default behavior.

---

## Lift

```tsx
<Card hoverEffect="lift">
```

Effect:

* Slight upward movement
* Enhanced shadow

---

## Zoom

```tsx
<Card hoverEffect="zoom">
```

Effect:

* Subtle scaling animation

---

## Glow

```tsx
<Card hoverEffect="glow">
```

Effect:

* Highlighted border
* Soft focus ring

---

# Pressable Cards

Cards can behave like interactive elements.

```tsx
<Card isPressable>
```

Features:

* Pointer cursor
* Active scaling feedback
* Improved UX

Applied styles:

```txt
cursor-pointer
active:scale-[0.99]
```

---

# Card Media

Supports responsive image rendering.

```tsx
<CardMedia
  src="/image.jpg"
  alt="Example"
/>
```

---

## Video Aspect Ratio

```tsx
<CardMedia
  aspectRatio="video"
/>
```

Output:

```txt
16:9
```

---

## Square Aspect Ratio

```tsx
<CardMedia
  aspectRatio="square"
/>
```

Output:

```txt
1:1
```

---

## Auto Height

```tsx
<CardMedia
  aspectRatio="auto"
/>
```

Output:

```txt
Natural Image Dimensions
```

---

# Card Header

Container for titles and descriptions.

```tsx
<CardHeader>
  ...
</CardHeader>
```

Responsibilities:

* Structure content
* Maintain spacing consistency

---

# Card Title

Primary heading element.

```tsx
<CardTitle>
  Product Name
</CardTitle>
```

Automatically scales based on card size.

---

# Card Description

Secondary text element.

```tsx
<CardDescription>
  Product summary
</CardDescription>
```

Uses semantic muted text styling.

---

# Card Content

Main content container.

```tsx
<CardContent>
  Main content
</CardContent>
```

Supports:

* Text
* Forms
* Lists
* Custom components

---

# Card Footer

Bottom action area.

```tsx
<CardFooter>
  ...
</CardFooter>
```

Typically contains:

* Buttons
* Actions
* Metadata

---

# Card Action

Built-in card button component.

```tsx
<CardAction>
  Learn More
</CardAction>
```

Features:

* Responsive sizing
* Focus states
* Disabled support

---

# Responsive Design

The card automatically adjusts using:

```tsx
max-w-sm
max-w-md
max-w-lg
max-w-2xl
```

Benefits:

* Mobile-friendly layouts
* Better content scaling
* Consistent spacing

---

# Context Architecture

The component uses React Context to share:

```tsx
size
layout
```

with child components.

Benefits:

* No prop drilling
* Consistent styling
* Cleaner APIs

---

# Accessibility

Includes:

* Semantic heading structure
* Button accessibility
* Focus-visible support
* Disabled state handling

Example:

```tsx
focus-ring-visible
```

Benefits:

* Keyboard navigation support
* Better accessibility compliance

---

# Design System Integration

Uses semantic design tokens:

```txt
bg-surface
border-border
text-fg
text-fg-muted
bg-primary
text-primary-fg
```

Benefits:

* Theme support
* Dark mode compatibility
* Consistent visual language

---
