## 1. ConfirmModal Component

- [x] 1.1 Create `web/src/components/ConfirmModal.tsx` with props: `open`, `title`, `message`, `confirmLabel`, `onConfirm`, `onCancel`, and optional `confirmVariant` for destructive styling

## 2. Integration

- [x] 2.1 Replace `window.confirm()` in `App.tsx` logout handler with state-driven `ConfirmModal` (add `showLogoutModal` state, render modal with logout-specific title/message/confirm label)
