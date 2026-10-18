import { Play, Pause, Home, Wind, Droplets } from 'lucide-react'
import { startCleaning, pauseCleaning, dockVacuum, setFanSpeed, setMopMode } from '@/lib/api'
import { fanSpeeds, mopModes } from '@/types/status'
import type { VacuumStatus } from '@/types/status'
import { useI18n } from '@/lib/i18n'
import { PageHead, SecTitle } from '@/components/ui'

interface Props {
  slug: string
  deviceName: string
  status?: VacuumStatus
  actionLoading: string | null
  onAction: (action: string, fn: () => Promise<void>) => void
  onClose: () => void
}

export function ControlsPage({ slug, deviceName, status, actionLoading, onAction, onClose }: Props) {
  const { t, tv } = useI18n()
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHead title={t('controls')} sub={deviceName} onBack={onClose} />

      <section>
        <SecTitle>{t('actions')}</SecTitle>
        <div className="grid grid-cols-3 gap-2.5">
          <button className="btn act" onClick={() => onAction('start', () => startCleaning(slug))} disabled={actionLoading === 'start'}>
            <Play className="size-[18px]" /> {t('start')}
          </button>
          <button className="btn act" onClick={() => onAction('pause', () => pauseCleaning(slug))} disabled={actionLoading === 'pause'}>
            <Pause className="size-[18px]" /> {t('pause')}
          </button>
          <button className="btn act" onClick={() => onAction('dock', () => dockVacuum(slug))} disabled={actionLoading === 'dock'}>
            <Home className="size-[18px]" /> {t('dock')}
          </button>
        </div>
      </section>

      <section>
        <SecTitle>
          <Wind className="size-4" /> {t('fan')}
        </SecTitle>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {fanSpeeds.map((speed) => (
            <button
              key={speed}
              className="opt"
              aria-pressed={status?.fan_speed === speed}
              onClick={() => onAction(`fan-${speed}`, () => setFanSpeed(slug, speed))}
              disabled={actionLoading?.startsWith('fan-') ?? false}
            >
              {tv('fan', speed)}
            </button>
          ))}
        </div>
      </section>

      <section>
        <SecTitle>
          <Droplets className="size-4" /> {t('mop')}
        </SecTitle>
        <div className="grid grid-cols-3 gap-2">
          {mopModes.map((mode) => (
            <button
              key={mode}
              className="opt"
              aria-pressed={status?.mop_mode === mode}
              onClick={() => onAction(`mop-${mode}`, () => setMopMode(slug, mode))}
              disabled={actionLoading?.startsWith('mop-') ?? false}
            >
              {tv('mop', mode)}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
