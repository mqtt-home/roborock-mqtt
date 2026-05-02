## Context

The app uses React 19, Tailwind CSS, and lucide-react icons. It supports dark/light themes via CSS variables (`bg-background`, `text-foreground`, `bg-card`, `border-border`, etc.). The current logout uses `window.confirm()`.

## Goals / Non-Goals

**Goals:**
- Create a reusable `ConfirmModal` component that can be used for any confirmation dialog
- Style it with the existing Tailwind theme tokens (card, border, foreground, etc.)
- Include a backdrop overlay, centered card, title, message, and two action buttons

**Non-Goals:**
- A full modal/dialog system or portal-based rendering — a simple fixed-position overlay is sufficient
- Animation/transitions — keep it simple

## Decisions

### 1. Generic ConfirmModal component

Build a `ConfirmModal` with props: `open`, `title`, `message`, `confirmLabel`, `onConfirm`, `onCancel`. This keeps it reusable if other confirmations are needed later. The confirm button uses a destructive (red) style for the logout case.

### 2. No portal, just fixed positioning

Use `fixed inset-0` with a backdrop and centered content. The app is a single-page mobile-first layout — no z-index conflicts or scroll issues to worry about.
