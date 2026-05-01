import { useState, useEffect, useRef } from 'react';
import { Battery, Clock, MapPin, Loader2 } from 'lucide-react';
import type { VacuumStatus } from '@/types/status';
import { formatCleanArea } from '@/types/status';

interface CleaningProgressProps {
  status: VacuumStatus;
}

const stateColors: Record<string, { bg: string; text: string; label: string }> = {
  cleaning: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'Cleaning' },
  spot_cleaning: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'Spot Cleaning' },
  segment_cleaning: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'Segment Cleaning' },
  zoned_cleaning: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'Zoned Cleaning' },
  returning_home: { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'Returning Home' },
  going_to_target: { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'Going to Target' },
  going_to_wash_mop: { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'Going to Wash' },
  washing_mop: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', label: 'Washing Mop' },
  emptying_dustbin: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', label: 'Emptying Dustbin' },
  charging: { bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'Charging' },
  paused: { bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'Paused' },
};

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

export function CleaningProgress({ status }: CleaningProgressProps) {
  const [displayTime, setDisplayTime] = useState(status.clean_time);
  const lastServerTime = useRef(status.clean_time);
  const isCleaning = status.in_cleaning;

  // Reset to server time on each SSE update
  useEffect(() => {
    lastServerTime.current = status.clean_time;
    setDisplayTime(status.clean_time);
  }, [status.clean_time]);

  // Local interpolation: increment every second while cleaning
  useEffect(() => {
    if (!isCleaning) return;
    const interval = setInterval(() => {
      setDisplayTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCleaning]);

  const stateInfo = stateColors[status.state] ?? {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    label: status.state.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
  };

  const batteryColor = status.battery > 50 ? 'text-green-500'
    : status.battery > 20 ? 'text-amber-500' : 'text-red-500';

  return (
    <div className={`mb-6 p-5 bg-card rounded-lg border-2 border-primary/30 relative overflow-hidden ${isCleaning ? 'animate-pulse-border' : ''}`}>
      {/* State badge */}
      <div className="flex items-center justify-between mb-4">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${stateInfo.bg} ${stateInfo.text}`}>
          {isCleaning && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {stateInfo.label}
        </div>
        <div className={`flex items-center gap-1.5 ${batteryColor}`}>
          <Battery className="h-4 w-4" />
          <span className="text-sm font-medium tabular-nums">{status.battery}%</span>
        </div>
      </div>

      {/* Progress stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">Elapsed</span>
          </div>
          <div className="text-2xl font-bold text-foreground tabular-nums">
            {formatTime(displayTime)}
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
            <MapPin className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">Area</span>
          </div>
          <div className="text-2xl font-bold text-foreground tabular-nums">
            {formatCleanArea(status.clean_area)}
          </div>
        </div>
      </div>
    </div>
  );
}
