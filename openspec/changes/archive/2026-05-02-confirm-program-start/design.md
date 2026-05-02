## Context

The app already has a reusable `ConfirmModal` component (used for logout). Programs are listed as buttons in App.tsx under the "Programs" section, each calling `executeScene` directly on click.

## Goals / Non-Goals

**Goals:**
- Add a confirmation step before starting any program
- Reuse the existing `ConfirmModal` component

**Non-Goals:**
- Confirmation for start/pause/dock controls (these are simple single actions)
- Changing the modal component itself

## Decisions

### 1. Pending scene state drives the modal

Add a `pendingScene` state (`SceneInfo | null`). Clicking a program button sets `pendingScene` instead of executing. The modal shows "Start {name}?" with a confirm button. On confirm, execute the scene and clear `pendingScene`. On cancel, clear it.
