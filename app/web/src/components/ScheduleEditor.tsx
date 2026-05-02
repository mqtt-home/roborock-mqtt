import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { DeviceSchedule, DayType, TimeSlot } from '@/types/schedule';
import type { SceneInfo } from '@/lib/api';
import { dayTypeLabels } from '@/types/schedule';
import { saveSchedule } from '@/lib/api';

const dayTypes: DayType[] = ['normal', 'weekend', 'free', 'notAtHome'];

interface Props {
  slug: string;
  initial?: DeviceSchedule;
  scenes?: SceneInfo[];
  onSave: (schedule: DeviceSchedule) => void;
  onCancel: () => void;
}

export function ScheduleEditor({ slug, initial, scenes = [], onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<DeviceSchedule>(() => ({
    normal: [...(initial?.normal ?? [])],
    weekend: [...(initial?.weekend ?? [])],
    free: [...(initial?.free ?? [])],
    notAtHome: [...(initial?.notAtHome ?? [])],
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasScenes = scenes.length > 0;

  const addSlot = (dayType: DayType) => {
    setDraft(prev => ({
      ...prev,
      [dayType]: [...(prev[dayType] ?? []), { time: '09:00', action: 'start' }],
    }));
  };

  const removeSlot = (dayType: DayType, index: number) => {
    setDraft(prev => ({
      ...prev,
      [dayType]: (prev[dayType] ?? []).filter((_, i) => i !== index),
    }));
  };

  const updateSlot = (dayType: DayType, index: number, updates: Partial<TimeSlot>) => {
    setDraft(prev => ({
      ...prev,
      [dayType]: (prev[dayType] ?? []).map((slot, i) =>
        i === index ? { ...slot, ...updates } : slot
      ),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveSchedule(slug, draft);
      onSave(draft);
    } catch {
      setError('Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {dayTypes.map(dayType => (
        <div key={dayType} className="p-3 bg-card rounded-lg border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">{dayTypeLabels[dayType]}</span>
            <button
              onClick={() => addSlot(dayType)}
              className="p-1 rounded hover:bg-accent transition-colors"
            >
              <Plus className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          {(draft[dayType] ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">No slots</p>
          ) : (
            <div className="space-y-2">
              {(draft[dayType] ?? []).map((slot, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="time"
                    value={slot.time}
                    onChange={e => updateSlot(dayType, i, { time: e.target.value })}
                    className="px-2 py-1 text-sm rounded border border-border bg-background text-foreground"
                  />
                  <select
                    value={slot.action}
                    onChange={e => {
                      const action = e.target.value;
                      const updates: Partial<TimeSlot> = { action };
                      if (action !== 'scene') updates.scene_id = undefined;
                      if (action === 'scene' && hasScenes) updates.scene_id = scenes[0].id;
                      updateSlot(dayType, i, updates);
                    }}
                    className="px-2 py-1 text-sm rounded border border-border bg-background text-foreground"
                  >
                    <option value="start">Start</option>
                    {hasScenes && <option value="scene">Scene</option>}
                  </select>
                  {slot.action === 'scene' && (
                    hasScenes ? (
                      <select
                        value={slot.scene_id ?? ''}
                        onChange={e => updateSlot(dayType, i, { scene_id: parseInt(e.target.value) })}
                        className="flex-1 min-w-0 px-2 py-1 text-sm rounded border border-border bg-background text-foreground"
                      >
                        {!scenes.find(s => s.id === slot.scene_id) && slot.scene_id != null && (
                          <option value={slot.scene_id}>Unknown ({slot.scene_id})</option>
                        )}
                        {scenes.map(scene => (
                          <option key={scene.id} value={scene.id}>{scene.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-muted-foreground">No scenes available</span>
                    )
                  )}
                  <button
                    onClick={() => removeSlot(dayType, i)}
                    className="p-1 rounded hover:bg-red-500/10 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="flex-1 py-2 px-4 rounded-lg border border-border bg-card text-foreground text-sm hover:bg-accent transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
