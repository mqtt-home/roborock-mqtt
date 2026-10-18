import { useState, useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, ChevronRight, Home, Palmtree, Plus, Sun } from 'lucide-react'
import { fetchSchedule } from '@/lib/api'
import type { SceneInfo } from '@/lib/api'
import type { DayType, NextAction, ScheduleSource, ScheduleState, TimeSlot } from '@/types/schedule'
import { prettify, useI18n, type I18n } from '@/lib/i18n'

export const dayTypeIcons: Record<DayType, ReactNode> = {
  normal: <Calendar />,
  weekend: <Sun />,
  free: <Palmtree />,
  notAtHome: <Home />,
}

/** "Küche (~25 min)", "Reinigung starten". */
export function actionLabel(slot: TimeSlot | NextAction, scenes: SceneInfo[], t: I18n['t']): string {
  if (slot.action === 'scene') {
    const scene = scenes.find((s) => s.id === slot.scene_id)
    if (!scene) return t('program.id', { id: slot.scene_id ?? '?' })
    return scene.recorded_minutes != null ? `${scene.name} (~${scene.recorded_minutes} min)` : scene.name
  }
  if (slot.action === 'start') return t('schedule.action.start')
  return prettify(slot.action)
}

function formatCountdown(targetHHMM: string): string {
  const now = new Date()
  const [h, m] = targetHHMM.split(':').map(Number)
  const target = new Date(now)
  target.setHours(h, m, 0, 0)
  // A time already past today means tomorrow.
  if (target <= now) target.setDate(target.getDate() + 1)
  let diff = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000))
  const hours = Math.floor(diff / 3600)
  diff %= 3600
  const mins = Math.floor(diff / 60)
  if (hours > 0) return `${hours} h ${mins} min`
  return `${mins} min`
}

function useCountdown(targetHHMM: string | undefined): string {
  const [countdown, setCountdown] = useState(() => (targetHHMM ? formatCountdown(targetHHMM) : ''))
  useEffect(() => {
    if (!targetHHMM) return
    setCountdown(formatCountdown(targetHHMM))
    const timer = setInterval(() => setCountdown(formatCountdown(targetHHMM)), 15000)
    return () => clearInterval(timer)
  }, [targetHHMM])
  return countdown
}

/** The schedule line on the device page: active day type and the next action. */
export function ScheduleRow({
  slug,
  scenes,
  sseScheduleState,
  icon,
}: {
  slug: string
  scenes: SceneInfo[]
  sseScheduleState?: ScheduleState
  icon: ReactNode
}) {
  const { t, tv } = useI18n()
  const [state, setState] = useState<ScheduleState | null>(null)
  const [source, setSource] = useState<ScheduleSource>('none')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSchedule(slug)
      .then((res) => {
        setSource(res.source)
        setState(res.configured && res.state ? res.state : null)
      })
      .catch(() => {
        setSource('none')
        setState(null)
      })
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (sseScheduleState && sseScheduleState.device === slug) {
      setState(sseScheduleState)
      setSource(sseScheduleState.source)
    }
  }, [sseScheduleState, slug])

  const nextAction = state?.next_action
  const countdown = useCountdown(nextAction?.time)
  const hasSchedule = source !== 'none' && state

  return (
    <Link to={`/devices/${slug}/schedule`} className="row-link">
      <span className="ico sm">{hasSchedule || loading ? icon : <Plus />}</span>
      <span className="min-w-0 flex-1">
        <span className="t flex items-center gap-2">
          {t('schedule')}
          {hasSchedule && (
            <span className="text-xs font-medium" style={{ color: 'var(--ink-3)' }}>
              · {tv('day', state.active_day)}
            </span>
          )}
        </span>
        <span className="s block truncate">
          {loading
            ? '…'
            : !hasSchedule
              ? t('schedule.create')
              : nextAction
                ? `${nextAction.time} · ${actionLabel(nextAction, scenes, t)} · ${t('schedule.in', { t: countdown })}`
                : t('schedule.none.today')}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0" style={{ color: 'var(--ink-4)' }} />
    </Link>
  )
}
