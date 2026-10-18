import { useState, useEffect } from 'react'
import { RotateCcw } from 'lucide-react'
import type { ConsumablePercents, ConsumableStatus } from '@/types/status'
import { resetConsumable } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { ConfirmModal, PageHead, levelClass } from '@/components/ui'

interface Props {
  slug: string
  deviceName: string
  percents: ConsumablePercents
  consumables: ConsumableStatus
  onClose: () => void
}

const consumableItems = [
  { key: 'main_brush' as const, workTimeKey: 'main_brush_work_time' as const, unit: 'time' as const },
  { key: 'side_brush' as const, workTimeKey: 'side_brush_work_time' as const, unit: 'time' as const },
  { key: 'filter' as const, workTimeKey: 'filter_work_time' as const, unit: 'time' as const },
  { key: 'sensor' as const, workTimeKey: 'sensor_dirty_time' as const, unit: 'time' as const },
  { key: 'dust_collection' as const, workTimeKey: 'dust_collection_work_times' as const, unit: 'cycles' as const },
]

export const consumableKeys = consumableItems.map((i) => i.key)

export function MaintenancePage({ slug, deviceName, percents, consumables, onClose }: Props) {
  const { t, tv, num } = useI18n()
  const [localPercents, setLocalPercents] = useState<ConsumablePercents | null>(null)
  const [localConsumables, setLocalConsumables] = useState<ConsumableStatus | null>(null)
  const [resetting, setResetting] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState<string | null>(null)

  // Local overrides after a reset, until fresh data arrives
  const displayPercents = localPercents ?? percents
  const displayConsumables = localConsumables ?? consumables

  useEffect(() => {
    setLocalPercents(null)
    setLocalConsumables(null)
  }, [percents, consumables])

  const handleReset = async (name: string) => {
    setConfirmReset(null)
    setResetting(name)
    try {
      const res = await resetConsumable(slug, name)
      if (res.consumables && res.consumable_percents) {
        setLocalConsumables(res.consumables)
        setLocalPercents(res.consumable_percents)
      }
    } catch (err) {
      console.error('Failed to reset consumable:', err)
    } finally {
      setResetting(null)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <PageHead title={t('maintenance')} sub={deviceName} onBack={onClose} />

      <div className="card px-4 py-1.5">
        <ul className="list">
          {consumableItems.map((item) => {
            const pct = displayPercents[item.key]
            const raw = displayConsumables[item.workTimeKey]
            const usage = item.unit === 'cycles' ? t('maint.cycles', { n: num(raw) }) : t('maint.hours', { h: num(Math.floor(raw / 3600)) })
            const lc = levelClass(pct)
            return (
              <li key={item.key} className="py-3">
                <div className="flex items-center gap-2">
                  <span className="text-[14.5px] font-medium">{tv('c', item.key)}</span>
                  <span
                    className="num ml-auto text-sm font-semibold"
                    style={lc ? { color: lc === 'bad' ? 'var(--alert)' : 'var(--warn)' } : undefined}
                  >
                    {pct} %
                  </span>
                  <button
                    className="icon-btn sm -mr-1.5"
                    onClick={() => setConfirmReset(item.key)}
                    disabled={resetting === item.key}
                    title={t('maint.reset')}
                    aria-label={t('maint.reset')}
                  >
                    <RotateCcw className={`size-4 ${resetting === item.key ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className={`meter ${lc}`} style={{ marginBottom: 6 }}>
                  <i style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
                </div>
                <div className="num text-xs" style={{ color: 'var(--ink-3)' }}>
                  {usage}
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <ConfirmModal
        open={confirmReset !== null}
        title={t('maint.reset.title')}
        message={t('maint.reset.message', { name: confirmReset ? tv('c', confirmReset) : '' })}
        confirmLabel={t('maint.reset.confirm')}
        onConfirm={() => confirmReset && handleReset(confirmReset)}
        onCancel={() => setConfirmReset(null)}
      />
    </div>
  )
}
