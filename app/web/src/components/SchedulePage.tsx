import { useState, useEffect, useMemo } from 'react'
import { Check, Clock, Pencil, Plus, Shield, Trash2, X } from 'lucide-react'
import { fetchSchedule, deleteSchedule, saveSchedule } from '@/lib/api'
import type { SceneInfo } from '@/lib/api'
import type { ScheduleState, DeviceSchedule, TimeSlot, DayType, ScheduleSource } from '@/types/schedule'
import { dayTypes } from '@/types/schedule'
import { useI18n } from '@/lib/i18n'
import { PageHead } from '@/components/ui'
import { actionLabel, dayTypeIcons } from '@/components/ScheduleSection'

interface Props {
  slug: string
  deviceName: string
  scenes: SceneInfo[]
  sseScheduleState?: ScheduleState
  onClose: () => void
}

interface EditingSlot {
  dayType: DayType
  index: number // -1 = new slot
  slot: TimeSlot
}

export function SchedulePage({ slug, deviceName, scenes, sseScheduleState, onClose }: Props) {
  const { t, tv } = useI18n()
  const [schedule, setSchedule] = useState<DeviceSchedule | null>(null)
  const [state, setState] = useState<ScheduleState | null>(null)
  const [source, setSource] = useState<ScheduleSource>('none')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editingSlot, setEditingSlot] = useState<EditingSlot | null>(null)

  const reload = () => {
    fetchSchedule(slug)
      .then((res) => {
        setSource(res.source)
        if (res.configured) {
          setSchedule(res.schedule ?? null)
          setState(res.state ?? null)
        } else {
          setSchedule(null)
          setState(null)
        }
      })
      .catch(() => {
        setSource('none')
        setSchedule(null)
        setState(null)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setEditingSlot(null)
    reload()
  }, [slug])

  useEffect(() => {
    if (sseScheduleState && sseScheduleState.device === slug) {
      setState(sseScheduleState)
      setSource(sseScheduleState.source)
    }
  }, [sseScheduleState, slug])

  const currentTime = useMemo(() => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  }, [state])

  const hasSchedule = source !== 'none' && schedule && state
  const activeDay = state?.active_day ?? 'normal'
  const isProvisioned = source === 'provisioned'
  const hasScenes = scenes.length > 0

  const persistSchedule = async (updated: DeviceSchedule) => {
    setSaving(true)
    try {
      await saveSchedule(slug, updated)
      reload()
    } catch (err) {
      console.error('Failed to save schedule:', err)
    } finally {
      setSaving(false)
    }
  }

  const empty: DeviceSchedule = { normal: [], weekend: [], free: [], notAtHome: [] }

  const handleSaveSlot = async () => {
    if (!editingSlot) return
    const current = schedule ?? empty
    const slots = [...(current[editingSlot.dayType] ?? [])]
    if (editingSlot.index === -1) slots.push(editingSlot.slot)
    else slots[editingSlot.index] = editingSlot.slot
    slots.sort((a, b) => a.time.localeCompare(b.time))
    setEditingSlot(null)
    await persistSchedule({ ...current, [editingSlot.dayType]: slots })
  }

  const handleDeleteSlot = async (dayType: DayType, index: number) => {
    const current = schedule ?? empty
    await persistSchedule({ ...current, [dayType]: (current[dayType] ?? []).filter((_, i) => i !== index) })
  }

  const handleDeleteSchedule = async () => {
    if (!window.confirm(t('schedule.delete.confirm'))) return
    setDeleting(true)
    try {
      await deleteSchedule(slug)
      reload()
    } catch (err) {
      console.error('Failed to delete schedule:', err)
    } finally {
      setDeleting(false)
    }
  }

  const updateEditingSlot = (updates: Partial<TimeSlot>) => {
    if (!editingSlot) return
    setEditingSlot({ ...editingSlot, slot: { ...editingSlot.slot, ...updates } })
  }

  const editor = (slot: TimeSlot, key?: number) => (
    <SlotEditor
      key={key}
      slot={slot}
      scenes={scenes}
      hasScenes={hasScenes}
      saving={saving}
      onChange={updateEditingSlot}
      onSave={handleSaveSlot}
      onCancel={() => setEditingSlot(null)}
    />
  )

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <PageHead
        title={t('schedule')}
        sub={deviceName}
        onBack={onClose}
        right={
          <>
            {source === 'provisioned' && (
              <span className="state">
                <Shield className="size-3.5" /> {t('schedule.provisioned')}
              </span>
            )}
            {source === 'user' && (
              <button className="btn danger" onClick={handleDeleteSchedule} disabled={deleting}>
                <Trash2 className="size-4" /> {t('delete')}
              </button>
            )}
          </>
        }
      />

      {loading ? (
        <div className="py-8 text-center" style={{ color: 'var(--ink-3)' }}>
          {t('loading')}
        </div>
      ) : (
        <>
          <p className="text-xs" style={{ color: 'var(--ink-3)' }}>
            {t('schedule.priority')}
          </p>

          {dayTypes.map((dayType) => {
            const isActive = dayType === activeDay
            const slots = hasSchedule ? (schedule[dayType] ?? []) : []
            const addingHere = editingSlot?.dayType === dayType && editingSlot.index === -1

            return (
              <section
                key={dayType}
                className="card"
                style={isActive ? { borderColor: 'color-mix(in oklab, var(--accent) 40%, transparent)' } : undefined}
              >
                <div className="card-h">
                  <span className="ico sm" style={isActive ? undefined : ({ '--c': 'var(--ink-3)' } as React.CSSProperties)}>
                    {dayTypeIcons[dayType]}
                  </span>
                  <h3>{tv('day', dayType)}</h3>
                  {isActive && (
                    <span className="state accent">
                      <span className="dot" /> {t('schedule.active')}
                    </span>
                  )}
                  {!isProvisioned && (
                    <button
                      className="icon-btn sm ml-auto -mr-1.5"
                      onClick={() => setEditingSlot({ dayType, index: -1, slot: { time: '09:00', action: 'start' } })}
                      title={t('schedule.add')}
                      aria-label={t('schedule.add')}
                    >
                      <Plus className="size-4" />
                    </button>
                  )}
                </div>
                <div className="card-b space-y-1">
                  {addingHere && editor(editingSlot.slot)}
                  {slots.length === 0 && !addingHere ? (
                    <p className="text-[13px]" style={{ color: 'var(--ink-3)' }}>
                      {t('schedule.noslots')}
                    </p>
                  ) : (
                    slots.map((slot, i) => {
                      const isPast = isActive && slot.time <= currentTime
                      const isNext = isActive && !isPast && (i === 0 || slots[i - 1].time <= currentTime)
                      if (editingSlot?.dayType === dayType && editingSlot.index === i) return editor(editingSlot.slot, i)
                      return (
                        <div key={i} className={`slot ${isNext ? 'next' : isPast ? 'past' : ''}`}>
                          {isPast ? (
                            <Check className="size-4 shrink-0" style={{ color: 'var(--ok)' }} />
                          ) : (
                            <Clock className="size-4 shrink-0" style={{ color: isNext ? 'var(--accent-ink)' : 'var(--ink-4)' }} />
                          )}
                          <span className="mono num font-medium" style={isNext ? { color: 'var(--accent-ink)' } : undefined}>
                            {slot.time}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm" style={{ color: 'var(--ink-2)' }}>
                            {actionLabel(slot, scenes, t)}
                          </span>
                          {isNext && <span className="kicker" style={{ color: 'var(--accent-ink)' }}>{t('schedule.next')}</span>}
                          {!isProvisioned && (
                            <span className="flex shrink-0">
                              <button
                                className="icon-btn sm"
                                onClick={() => setEditingSlot({ dayType, index: i, slot: { ...slot } })}
                                title={t('edit')}
                                aria-label={t('edit')}
                              >
                                <Pencil className="size-3.5" />
                              </button>
                              <button
                                className="icon-btn sm danger"
                                onClick={() => handleDeleteSlot(dayType, i)}
                                title={t('delete')}
                                aria-label={t('delete')}
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </span>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </section>
            )
          })}
        </>
      )}
    </div>
  )
}

function SlotEditor({
  slot,
  scenes,
  hasScenes,
  saving,
  onChange,
  onSave,
  onCancel,
}: {
  slot: TimeSlot
  scenes: SceneInfo[]
  hasScenes: boolean
  saving: boolean
  onChange: (updates: Partial<TimeSlot>) => void
  onSave: () => void
  onCancel: () => void
}) {
  const { t } = useI18n()
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl p-2" style={{ background: 'var(--accent-soft)' }}>
      <input type="time" className="ctl num" value={slot.time} onChange={(e) => onChange({ time: e.target.value })} />
      <select
        className="ctl"
        value={slot.action}
        onChange={(e) => {
          const action = e.target.value
          const updates: Partial<TimeSlot> = { action }
          if (action !== 'scene') updates.scene_id = undefined
          if (action === 'scene' && hasScenes) updates.scene_id = scenes[0].id
          onChange(updates)
        }}
      >
        <option value="start">{t('schedule.action.start')}</option>
        {hasScenes && <option value="scene">{t('schedule.action.scene')}</option>}
      </select>
      {slot.action === 'scene' && hasScenes && (
        <select className="ctl min-w-0 flex-1" value={slot.scene_id ?? ''} onChange={(e) => onChange({ scene_id: parseInt(e.target.value) })}>
          {!scenes.find((s) => s.id === slot.scene_id) && slot.scene_id != null && (
            <option value={slot.scene_id}>{t('schedule.unknownScene', { id: slot.scene_id })}</option>
          )}
          {scenes.map((scene) => (
            <option key={scene.id} value={scene.id}>
              {scene.name}
            </option>
          ))}
        </select>
      )}
      <span className="ml-auto flex gap-1">
        <button className="btn primary" style={{ minHeight: 40, padding: '0 12px' }} onClick={onSave} disabled={saving} title={t('save')} aria-label={t('save')}>
          <Check className="size-4" />
        </button>
        <button className="icon-btn" style={{ width: 40, height: 40 }} onClick={onCancel} title={t('cancel')} aria-label={t('cancel')}>
          <X className="size-4" />
        </button>
      </span>
    </div>
  )
}
