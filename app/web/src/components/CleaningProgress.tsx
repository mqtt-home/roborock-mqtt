import { useState, useEffect } from 'react'
import { Battery, Clock, MapPin, Flag, Wind } from 'lucide-react'
import type { VacuumStatus } from '@/types/status'
import { areaM2 } from '@/types/status'
import type { SceneInfo } from '@/lib/api'
import { useI18n, type I18n } from '@/lib/i18n'
import { Stat } from '@/components/ui'
import { batteryClass, isLive, stateClass } from '@/components/state'

// programLabel turns an internal program key into a readable label.
function programLabel(program: string, t: I18n['t'], scenes?: SceneInfo[]): string {
  if (program.startsWith('scene:')) {
    const id = Number(program.slice('scene:'.length))
    return scenes?.find((s) => s.id === id)?.name ?? t('program.id', { id })
  }
  if (program.startsWith('seg:')) {
    return t('program.rooms', { rooms: program.slice('seg:'.length).replace(/-/g, ', ') })
  }
  switch (program) {
    case 'full':
      return t('program.full')
    case 'zone':
      return t('program.zone')
    case 'segment':
      return t('program.segment')
    default:
      return program
  }
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`
  return `${pad(m)}:${pad(s)}`
}

export function CleaningProgress({ status, scenes }: { status: VacuumStatus; scenes?: SceneInfo[] }) {
  const { t, tv, num, clock, dur } = useI18n()
  const [displayTime, setDisplayTime] = useState(status.clean_time)
  const isCleaning = status.in_cleaning

  // Reset to server time on each SSE update
  useEffect(() => {
    setDisplayTime(status.clean_time)
  }, [status.clean_time])

  // Local interpolation: count up every second while cleaning
  useEffect(() => {
    if (!isCleaning) return
    const interval = setInterval(() => setDisplayTime((prev) => prev + 1), 1000)
    return () => clearInterval(interval)
  }, [isCleaning])

  const pct = status.clean_percent
  const bc = batteryClass(status.battery)
  const hasEstimate = status.remaining_minutes != null

  return (
    <section className="card">
      <div className="card-h">
        <span className={`state ${stateClass(status)}`}>
          <span className={`dot ${isLive(status) ? 'live' : ''}`} /> {tv('st', status.state)}
        </span>
        <span
          className="meta num flex items-center gap-1.5"
          style={bc ? { color: bc === 'bad' ? 'var(--alert)' : 'var(--warn)' } : undefined}
          title={t('battery')}
        >
          <Battery className="size-4" /> {status.battery} %
        </span>
      </div>
      <div className="card-b">
        <div className="mb-4 flex items-center gap-5">
          {pct != null && (
            <div className="pring" style={{ '--p': Math.min(100, Math.max(0, pct)) } as React.CSSProperties}>
              <span className="pct">{pct} %</span>
            </div>
          )}
          <div className="min-w-0">
            <div className="kicker">{hasEstimate ? t('remaining') : t('elapsed')}</div>
            <div className="big mt-1.5">{hasEstimate ? `~${status.remaining_minutes} min` : formatTime(displayTime)}</div>
            {status.program && (
              <div className="mt-1.5 truncate text-[13px]" style={{ color: 'var(--ink-3)' }}>
                {programLabel(status.program, t, scenes)}
                {status.recorded_minutes != null && ` · ${t('recorded', { min: status.recorded_minutes })}`}
              </div>
            )}
          </div>
        </div>
        <div className="stats compact" style={{ '--n': hasEstimate ? 3 : 2 } as React.CSSProperties}>
          {hasEstimate && <Stat icon={<Clock />} k={t('elapsed')} v={dur(displayTime)} />}
          <Stat icon={<MapPin />} k={t('area')} v={`${num(areaM2(status.clean_area), 1)} m²`} />
          {hasEstimate ? (
            <Stat icon={<Flag />} k={t('done.at')} v={clock(status.time_completed)} />
          ) : (
            <Stat icon={<Wind />} k={t('fan')} v={tv('fan', status.fan_speed)} />
          )}
        </div>
      </div>
    </section>
  )
}
