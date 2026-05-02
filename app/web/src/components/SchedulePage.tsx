import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Calendar, Home, Sun, Palmtree, Clock, Check, Pencil, Trash2, Shield, Plus, X } from 'lucide-react';
import { fetchSchedule, deleteSchedule, saveSchedule } from '@/lib/api';
import type { SceneInfo } from '@/lib/api';
import type { ScheduleState, DeviceSchedule, TimeSlot, DayType, ScheduleSource } from '@/types/schedule';
import { dayTypeLabels } from '@/types/schedule';

interface Props {
  slug: string;
  deviceName: string;
  scenes: SceneInfo[];
  sseScheduleState?: ScheduleState;
  onClose: () => void;
}

const dayTypeStyles: Record<DayType, { bg: string; text: string; icon: React.ReactNode }> = {
  normal: { bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-500', icon: <Calendar className="h-4 w-4" /> },
  weekend: { bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-500', icon: <Sun className="h-4 w-4" /> },
  free: { bg: 'bg-green-500/10 border-green-500/30', text: 'text-green-500', icon: <Palmtree className="h-4 w-4" /> },
  notAtHome: { bg: 'bg-gray-500/10 border-gray-500/30', text: 'text-gray-500', icon: <Home className="h-4 w-4" /> },
};

const allDayTypes: DayType[] = ['normal', 'weekend', 'free', 'notAtHome'];

function getActionLabel(slot: TimeSlot, scenes: SceneInfo[]): string {
  if (slot.action === 'scene') {
    const scene = scenes.find(s => s.id === slot.scene_id);
    return scene ? scene.name : `Scene #${slot.scene_id}`;
  }
  return slot.action.charAt(0).toUpperCase() + slot.action.slice(1);
}

interface EditingSlot {
  dayType: DayType;
  index: number; // -1 = new slot
  slot: TimeSlot;
}

export function SchedulePage({ slug, deviceName, scenes, sseScheduleState, onClose }: Props) {
  const [schedule, setSchedule] = useState<DeviceSchedule | null>(null);
  const [state, setState] = useState<ScheduleState | null>(null);
  const [source, setSource] = useState<ScheduleSource>('none');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingSlot, setEditingSlot] = useState<EditingSlot | null>(null);

  const reload = () => {
    fetchSchedule(slug)
      .then(res => {
        setSource(res.source);
        if (res.configured) {
          setSchedule(res.schedule ?? null);
          setState(res.state ?? null);
        } else {
          setSchedule(null);
          setState(null);
        }
      })
      .catch(() => {
        setSource('none');
        setSchedule(null);
        setState(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setEditingSlot(null);
    reload();
  }, [slug]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (sseScheduleState && sseScheduleState.device === slug) {
      setState(sseScheduleState);
      setSource(sseScheduleState.source);
    }
  }, [sseScheduleState, slug]);

  const currentTime = useMemo(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }, [state]);

  const hasSchedule = source !== 'none' && schedule && state;
  const activeDay = state?.active_day ?? 'normal';
  const isProvisioned = source === 'provisioned';
  const hasScenes = scenes.length > 0;

  const persistSchedule = async (updated: DeviceSchedule) => {
    setSaving(true);
    try {
      await saveSchedule(slug, updated);
      reload();
    } catch (err) {
      console.error('Failed to save schedule:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSlot = (dayType: DayType) => {
    setEditingSlot({ dayType, index: -1, slot: { time: '09:00', action: 'start' } });
  };

  const handleEditSlot = (dayType: DayType, index: number, slot: TimeSlot) => {
    setEditingSlot({ dayType, index, slot: { ...slot } });
  };

  const handleSaveSlot = async () => {
    if (!editingSlot) return;
    const current = schedule ?? { normal: [], weekend: [], free: [], notAtHome: [] };
    const slots = [...(current[editingSlot.dayType] ?? [])];

    if (editingSlot.index === -1) {
      slots.push(editingSlot.slot);
    } else {
      slots[editingSlot.index] = editingSlot.slot;
    }
    slots.sort((a, b) => a.time.localeCompare(b.time));

    const updated = { ...current, [editingSlot.dayType]: slots };
    setEditingSlot(null);
    await persistSchedule(updated);
  };

  const handleDeleteSlot = async (dayType: DayType, index: number) => {
    const current = schedule ?? { normal: [], weekend: [], free: [], notAtHome: [] };
    const slots = (current[dayType] ?? []).filter((_, i) => i !== index);
    const updated = { ...current, [dayType]: slots };
    await persistSchedule(updated);
  };

  const handleDeleteSchedule = async () => {
    if (!window.confirm('Delete this schedule? If a provisioned schedule exists, it will become active again.')) return;
    setDeleting(true);
    try {
      await deleteSchedule(slug);
      reload();
    } catch (err) {
      console.error('Failed to delete schedule:', err);
    } finally {
      setDeleting(false);
    }
  };

  const updateEditingSlot = (updates: Partial<TimeSlot>) => {
    if (!editingSlot) return;
    setEditingSlot({ ...editingSlot, slot: { ...editingSlot.slot, ...updates } });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="max-w-md mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Schedule</h1>
            <p className="text-sm text-muted-foreground">{deviceName}</p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            {source === 'provisioned' && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-purple-500/10 text-purple-500 border border-purple-500/20">
                <Shield className="h-3 w-3" />
                Provisioned
              </span>
            )}
            {source === 'user' && (
              <button
                onClick={handleDeleteSchedule}
                disabled={deleting}
                className="flex items-center gap-1 px-2 py-1 rounded-lg border border-red-500/20 text-xs text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-8">Loading...</div>
        ) : (
          <div className="space-y-4">
            {/* Priority explanation */}
            <p className="text-xs text-muted-foreground">
              Priority: Not at Home &gt; Weekend / Holiday &gt; Free Day &gt; Normal
            </p>

            {/* All day type schedules */}
            {allDayTypes.map(dayType => {
              const isActive = dayType === activeDay;
              const dtStyle = dayTypeStyles[dayType];
              const dtSlots = hasSchedule ? (schedule[dayType] ?? []) : [];

              return (
                <div
                  key={dayType}
                  className={`rounded-lg border p-4 ${
                    isActive
                      ? dtStyle.bg
                      : 'border-border bg-card/50 opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={dtStyle.text}>{dtStyle.icon}</span>
                    <h2 className={`text-sm font-medium ${isActive ? dtStyle.text : 'text-muted-foreground'}`}>
                      {dayTypeLabels[dayType]}
                    </h2>
                    {isActive && (
                      <span className="text-xs uppercase tracking-wide bg-primary text-primary-foreground px-2 py-0.5 rounded">
                        Active
                      </span>
                    )}
                    {!isProvisioned && (
                      <button
                        onClick={() => handleAddSlot(dayType)}
                        className="ml-auto p-1 rounded hover:bg-accent transition-colors"
                        title="Add time slot"
                      >
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      </button>
                    )}
                  </div>

                  {/* Inline editor for new slot */}
                  {editingSlot && editingSlot.dayType === dayType && editingSlot.index === -1 && (
                    <SlotEditor
                      slot={editingSlot.slot}
                      scenes={scenes}
                      hasScenes={hasScenes}
                      saving={saving}
                      onChange={updateEditingSlot}
                      onSave={handleSaveSlot}
                      onCancel={() => setEditingSlot(null)}
                    />
                  )}

                  {dtSlots.length === 0 && !(editingSlot && editingSlot.dayType === dayType && editingSlot.index === -1) ? (
                    <p className="text-xs text-muted-foreground">No slots configured</p>
                  ) : (
                    <div className="space-y-1.5">
                      {dtSlots.map((slot, i) => {
                        const isPast = isActive && slot.time <= currentTime;
                        const isNext = isActive && !isPast && (i === 0 || dtSlots[i - 1].time <= currentTime);
                        const isEditingThis = editingSlot && editingSlot.dayType === dayType && editingSlot.index === i;

                        if (isEditingThis) {
                          return (
                            <SlotEditor
                              key={i}
                              slot={editingSlot.slot}
                              scenes={scenes}
                              hasScenes={hasScenes}
                              saving={saving}
                              onChange={updateEditingSlot}
                              onSave={handleSaveSlot}
                              onCancel={() => setEditingSlot(null)}
                            />
                          );
                        }

                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                              isNext
                                ? 'border-primary/30 bg-primary/5'
                                : isPast
                                  ? 'border-border/50 opacity-60'
                                  : isActive
                                    ? 'border-border/50 bg-card/50'
                                    : 'border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              {isPast ? (
                                <Check className="h-3.5 w-3.5 text-green-500" />
                              ) : (
                                <Clock className={`h-3.5 w-3.5 ${isNext ? 'text-primary' : 'text-muted-foreground'}`} />
                              )}
                              <span className={`text-sm font-mono tabular-nums ${isNext ? 'text-primary font-medium' : 'text-foreground'}`}>
                                {slot.time}
                              </span>
                            </div>
                            <span className="text-sm text-muted-foreground">{getActionLabel(slot, scenes)}</span>
                            {isNext && (
                              <span className="ml-auto text-xs uppercase tracking-wide bg-primary text-primary-foreground px-2 py-0.5 rounded">
                                Next
                              </span>
                            )}
                            {!isProvisioned && (
                              <div className="ml-auto flex items-center gap-0.5">
                                <button
                                  onClick={() => handleEditSlot(dayType, i, slot)}
                                  className="p-1 rounded hover:bg-accent transition-colors"
                                  title="Edit"
                                >
                                  <Pencil className="h-3 w-3 text-muted-foreground" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSlot(dayType, i)}
                                  className="p-1 rounded hover:bg-red-500/10 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3 w-3 text-red-500" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SlotEditor({ slot, scenes, hasScenes, saving, onChange, onSave, onCancel }: {
  slot: TimeSlot;
  scenes: SceneInfo[];
  hasScenes: boolean;
  saving: boolean;
  onChange: (updates: Partial<TimeSlot>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg border border-primary/30 bg-primary/5">
      <input
        type="time"
        value={slot.time}
        onChange={e => onChange({ time: e.target.value })}
        className="px-2 py-1 text-sm rounded border border-border bg-background text-foreground"
      />
      <select
        value={slot.action}
        onChange={e => {
          const action = e.target.value;
          const updates: Partial<TimeSlot> = { action };
          if (action !== 'scene') updates.scene_id = undefined;
          if (action === 'scene' && hasScenes) updates.scene_id = scenes[0].id;
          onChange(updates);
        }}
        className="px-2 py-1 text-sm rounded border border-border bg-background text-foreground"
      >
        <option value="start">Start</option>
        {hasScenes && <option value="scene">Scene</option>}
      </select>
      {slot.action === 'scene' && hasScenes && (
        <select
          value={slot.scene_id ?? ''}
          onChange={e => onChange({ scene_id: parseInt(e.target.value) })}
          className="flex-1 min-w-0 px-2 py-1 text-sm rounded border border-border bg-background text-foreground"
        >
          {!scenes.find(s => s.id === slot.scene_id) && slot.scene_id != null && (
            <option value={slot.scene_id}>Unknown ({slot.scene_id})</option>
          )}
          {scenes.map(scene => (
            <option key={scene.id} value={scene.id}>{scene.name}</option>
          ))}
        </select>
      )}
      <button
        onClick={onSave}
        disabled={saving}
        className="p-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        title="Save"
      >
        <Check className="h-4 w-4" />
      </button>
      <button
        onClick={onCancel}
        className="p-1 rounded hover:bg-accent transition-colors"
        title="Cancel"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}
