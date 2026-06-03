import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Home, Sun, Palmtree, Clock, ChevronRight, Plus } from 'lucide-react';
import { fetchSchedule } from '@/lib/api';
import type { SceneInfo } from '@/lib/api';
import type { ScheduleState, DayType, ScheduleSource } from '@/types/schedule';
import { dayTypeLabels } from '@/types/schedule';

interface Props {
  slug: string;
  deviceName?: string;
  scenes: SceneInfo[];
  sseScheduleState?: ScheduleState;
}

const dayTypeStyles: Record<DayType, { bg: string; text: string; icon: React.ReactNode }> = {
  normal: { bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-500', icon: <Calendar className="h-3.5 w-3.5" /> },
  weekend: { bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-500', icon: <Sun className="h-3.5 w-3.5" /> },
  free: { bg: 'bg-green-500/10 border-green-500/30', text: 'text-green-500', icon: <Palmtree className="h-3.5 w-3.5" /> },
  notAtHome: { bg: 'bg-gray-500/10 border-gray-500/30', text: 'text-gray-500', icon: <Home className="h-3.5 w-3.5" /> },
};

function getNextActionLabel(nextAction: { time: string; action: string; scene_id?: number }, scenes: SceneInfo[]): string {
  if (nextAction.action === 'scene') {
    const scene = scenes.find(s => s.id === nextAction.scene_id);
    if (!scene) return `Scene #${nextAction.scene_id}`;
    return scene.recorded_minutes != null ? `${scene.name} (~${scene.recorded_minutes} min)` : scene.name;
  }
  return nextAction.action.charAt(0).toUpperCase() + nextAction.action.slice(1);
}

function formatCountdown(targetHHMM: string): string {
  const now = new Date();
  const [h, m] = targetHHMM.split(':').map(Number);

  const target = new Date(now);
  target.setHours(h, m, 0, 0);

  // If target is in the past, it's tomorrow
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  let diff = Math.floor((target.getTime() - now.getTime()) / 1000);
  if (diff < 0) diff = 0;

  const days = Math.floor(diff / 86400);
  diff %= 86400;
  const hours = Math.floor(diff / 3600);
  diff %= 3600;
  const mins = Math.floor(diff / 60);
  const secs = diff % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${mins}m`);
  parts.push(`${secs}s`);
  return parts.join(' ');
}

function useCountdown(targetHHMM: string | undefined): string {
  const [countdown, setCountdown] = useState(() => targetHHMM ? formatCountdown(targetHHMM) : '');

  useEffect(() => {
    if (!targetHHMM) return;
    setCountdown(formatCountdown(targetHHMM));
    const timer = setInterval(() => setCountdown(formatCountdown(targetHHMM)), 1000);
    return () => clearInterval(timer);
  }, [targetHHMM]);

  return countdown;
}

export function ScheduleSection({ slug, scenes, sseScheduleState }: Props) {
  const [state, setState] = useState<ScheduleState | null>(null);
  const [source, setSource] = useState<ScheduleSource>('none');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedule(slug)
      .then(res => {
        setSource(res.source);
        if (res.configured && res.state) {
          setState(res.state);
        } else {
          setState(null);
        }
      })
      .catch(() => {
        setSource('none');
        setState(null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (sseScheduleState && sseScheduleState.device === slug) {
      setState(sseScheduleState);
      setSource(sseScheduleState.source);
    }
  }, [sseScheduleState, slug]);

  const hasSchedule = source !== 'none' && state;
  const activeDay = state?.active_day ?? 'normal';
  const style = dayTypeStyles[activeDay];
  const nextAction = state?.next_action;
  const countdown = useCountdown(nextAction?.time);

  if (loading) return null;

  return (
    <div className="mb-6">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Schedule</h2>

      {hasSchedule ? (
        <Link
          to={`/devices/${slug}/schedule`}
          className="block w-full p-4 bg-card rounded-lg border border-border hover:bg-accent transition-colors text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border flex-shrink-0 ${style.bg}`}>
                <span className={style.text}>{style.icon}</span>
                <span className={`text-xs font-medium ${style.text}`}>{dayTypeLabels[activeDay]}</span>
              </div>
              {nextAction ? (
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{getNextActionLabel(nextAction, scenes)}</span>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-muted-foreground/70">
                    {nextAction.time} ({countdown})
                  </span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">No more actions today</span>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </div>
        </Link>
      ) : (
        <Link
          to={`/devices/${slug}/schedule`}
          className="block w-full p-4 bg-card rounded-lg border border-border hover:bg-accent transition-colors text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Plus className="h-4 w-4" />
              <span>Create Schedule</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </Link>
      )}
    </div>
  );
}
