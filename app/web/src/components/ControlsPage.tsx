import { ArrowLeft, Play, Pause, Home, Wind, Droplets } from 'lucide-react';
import { startCleaning, pauseCleaning, dockVacuum, setFanSpeed, setMopMode } from '@/lib/api';
import { fanSpeeds, mopModes, formatDisplayName } from '@/types/status';
import type { VacuumStatus } from '@/types/status';

interface Props {
  slug: string;
  status?: VacuumStatus;
  actionLoading: string | null;
  onAction: (action: string, fn: () => Promise<void>) => void;
  onClose: () => void;
}

export function ControlsPage({ slug, status, actionLoading, onAction, onClose }: Props) {
  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onClose} className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors" aria-label="Back">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Controls</h1>
      </div>

      <div className="mb-6">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => onAction('start', () => startCleaning(slug))} disabled={actionLoading === 'start'} className="p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors touch-target flex flex-col items-center gap-2">
            <Play className="h-6 w-6 text-green-500" /><span className="text-xs text-muted-foreground">Start</span>
          </button>
          <button onClick={() => onAction('pause', () => pauseCleaning(slug))} disabled={actionLoading === 'pause'} className="p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors touch-target flex flex-col items-center gap-2">
            <Pause className="h-6 w-6 text-amber-500" /><span className="text-xs text-muted-foreground">Pause</span>
          </button>
          <button onClick={() => onAction('dock', () => dockVacuum(slug))} disabled={actionLoading === 'dock'} className="p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors touch-target flex flex-col items-center gap-2">
            <Home className="h-6 w-6 text-primary" /><span className="text-xs text-muted-foreground">Dock</span>
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Wind className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Fan Speed</h2>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {fanSpeeds.map((speed) => (
            <button key={speed} onClick={() => onAction(`fan-${speed}`, () => setFanSpeed(slug, speed))} disabled={actionLoading?.startsWith('fan-') ?? false}
              className={`p-3 rounded-lg border-2 transition-all text-sm touch-target ${status?.fan_speed === speed ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border bg-card text-muted-foreground hover:border-primary/50'}`}>
              {formatDisplayName(speed)}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Droplets className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Mop Mode</h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {mopModes.map((mode) => (
            <button key={mode} onClick={() => onAction(`mop-${mode}`, () => setMopMode(slug, mode))} disabled={actionLoading?.startsWith('mop-') ?? false}
              className={`p-3 rounded-lg border-2 transition-all text-sm touch-target ${status?.mop_mode === mode ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border bg-card text-muted-foreground hover:border-primary/50'}`}>
              {formatDisplayName(mode)}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
