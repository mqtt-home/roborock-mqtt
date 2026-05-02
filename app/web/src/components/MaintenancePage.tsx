import { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import type { ConsumablePercents, ConsumableStatus } from '@/types/status';
import { resetConsumable } from '@/lib/api';
import { ConfirmModal } from '@/components/ConfirmModal';

interface Props {
  slug: string;
  deviceName: string;
  percents: ConsumablePercents;
  consumables: ConsumableStatus;
  onClose: () => void;
}

const consumableItems = [
  { key: 'main_brush' as const, label: 'Main Brush', workTimeKey: 'main_brush_work_time' as const, unit: 'time' as const },
  { key: 'side_brush' as const, label: 'Side Brush', workTimeKey: 'side_brush_work_time' as const, unit: 'time' as const },
  { key: 'filter' as const, label: 'Filter', workTimeKey: 'filter_work_time' as const, unit: 'time' as const },
  { key: 'sensor' as const, label: 'Sensor', workTimeKey: 'sensor_dirty_time' as const, unit: 'time' as const },
  { key: 'dust_collection' as const, label: 'Dust Collection', workTimeKey: 'dust_collection_work_times' as const, unit: 'cycles' as const },
];

function percentColor(pct: number): string {
  if (pct > 50) return 'bg-green-500';
  if (pct > 20) return 'bg-amber-500';
  return 'bg-red-500';
}

function percentTextColor(pct: number): string {
  if (pct > 50) return 'text-green-500';
  if (pct > 20) return 'text-amber-500';
  return 'text-red-500';
}

export function MaintenancePage({ slug, deviceName, percents, consumables, onClose }: Props) {
  const [localPercents, setLocalPercents] = useState<ConsumablePercents | null>(null);
  const [localConsumables, setLocalConsumables] = useState<ConsumableStatus | null>(null);
  const [resetting, setResetting] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState<string | null>(null);

  // Use local overrides if we have them (from a reset), otherwise use props
  const displayPercents = localPercents ?? percents;
  const displayConsumables = localConsumables ?? consumables;

  // When props update from SSE/polling, clear local overrides so fresh data shows
  useEffect(() => {
    setLocalPercents(null);
    setLocalConsumables(null);
  }, [percents, consumables]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleReset = async (name: string) => {
    setConfirmReset(null);
    setResetting(name);
    try {
      const res = await resetConsumable(slug, name);
      if (res.consumables && res.consumable_percents) {
        setLocalConsumables(res.consumables);
        setLocalPercents(res.consumable_percents);
      }
    } catch (err) {
      console.error('Failed to reset consumable:', err);
    } finally {
      setResetting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="max-w-md mx-auto p-4 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Maintenance</h1>
            <p className="text-sm text-muted-foreground">{deviceName}</p>
          </div>
        </div>

        <div className="space-y-3">
          {consumableItems.map(item => {
            const pct = displayPercents[item.key];
            const rawValue = displayConsumables[item.workTimeKey];
            const usageLabel = item.unit === 'cycles' ? `${rawValue} cycles` : `${Math.floor(rawValue / 3600)}h used`;
            return (
              <div key={item.key} className={`p-4 bg-card rounded-lg border ${pct <= 20 ? 'border-red-500/30' : 'border-border'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-mono tabular-nums ${percentTextColor(pct)}`}>{pct}%</span>
                    <button
                      onClick={() => setConfirmReset(item.key)}
                      disabled={resetting === item.key}
                      className="p-1 rounded hover:bg-accent transition-colors"
                      title="Reset counter"
                    >
                      <RotateCcw className={`h-3.5 w-3.5 ${resetting === item.key ? 'animate-spin' : ''} text-muted-foreground`} />
                    </button>
                  </div>
                </div>
                <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${percentColor(pct)}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{usageLabel}</p>
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmModal
        open={confirmReset !== null}
        title="Reset counter"
        message={`Reset the ${consumableItems.find(i => i.key === confirmReset)?.label ?? ''} counter? Only do this after replacing or cleaning the component.`}
        confirmLabel="Reset"
        onConfirm={() => confirmReset && handleReset(confirmReset)}
        onCancel={() => setConfirmReset(null)}
      />
    </div>
  );
}
