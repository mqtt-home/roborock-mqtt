import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const { t } = useI18n()
  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--ink-3)' }}>
          {message}
        </p>
        <div className="mt-5 flex gap-2.5">
          <button className="btn flex-1" onClick={onCancel}>
            {t('cancel')}
          </button>
          <button className={`btn flex-1 ${destructive ? 'solid-danger' : 'primary'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Sub-page heading with a back button. */
export function PageHead({ title, sub, onBack, right }: { title: string; sub?: string; onBack: () => void; right?: ReactNode }) {
  const { t } = useI18n()
  return (
    <div className="flex items-center gap-2">
      <button className="icon-btn -ml-2.5" onClick={onBack} aria-label={t('back')} title={t('back')}>
        <ArrowLeft className="size-5" />
      </button>
      <div className="min-w-0">
        <h1 className="truncate text-[19px] leading-tight font-semibold tracking-tight">{title}</h1>
        {sub && (
          <div className="truncate text-[13px]" style={{ color: 'var(--ink-3)' }}>
            {sub}
          </div>
        )}
      </div>
      {right && <div className="ml-auto flex items-center gap-1.5">{right}</div>}
    </div>
  )
}

export function SecTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="sec-title">
      <h2>{children}</h2>
      {right && <span className="r">{right}</span>}
    </div>
  )
}

/** Wear/charge level -> state class: colour only when something needs attention. */
export function levelClass(pct: number): '' | 'warn' | 'bad' {
  if (pct <= 20) return 'bad'
  if (pct <= 50) return 'warn'
  return ''
}

export function Stat({ icon, k, v, h }: { icon: ReactNode; k: string; v: ReactNode; h?: ReactNode }) {
  return (
    <div className="stat">
      <div className="k">
        {icon}
        {k}
      </div>
      <div className="v">{v}</div>
      {h && <div className="h">{h}</div>}
    </div>
  )
}

