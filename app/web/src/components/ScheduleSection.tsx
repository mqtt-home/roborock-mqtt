import { useState, useEffect } from 'react';
import { Calendar, Home, Sun, Palmtree, Clock, ChevronRight, Plus } from 'lucide-react';
import { fetchSchedule } from '@/lib/api';
import type { SceneInfo } from '@/lib/api';
import type { ScheduleState, DayType, ScheduleSource } from '@/types/schedule';
import { dayTypeLabels } from '@/types/schedule';
import { SchedulePage } from '@/components/SchedulePage';

interface Props {
  slug: string;
  deviceName: string;
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
    return scene ? scene.name : `Scene #${nextAction.scene_id}`;
  }
  return nextAction.action.charAt(0).toUpperCase() + nextAction.action.slice(1);
}

export function ScheduleSection({ slug, deviceName, scenes, sseScheduleState }: Props) {
  const [state, setState] = useState<ScheduleState | null>(null);
  const [source, setSource] = useState<ScheduleSource>('none');
  const [loading, setLoading] = useState(true);
  const [showPage, setShowPage] = useState(false);

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

  if (loading) return null;

  const hasSchedule = source !== 'none' && state;
  const activeDay = state?.active_day ?? 'normal';
  const style = dayTypeStyles[activeDay];
  const nextAction = state?.next_action;

  return (
    <>
      <div className="mb-6">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Schedule</h2>

        {hasSchedule ? (
          <button
            onClick={() => setShowPage(true)}
            className="w-full p-4 bg-card rounded-lg border border-border hover:bg-accent transition-colors text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${style.bg}`}>
                  <span className={style.text}>{style.icon}</span>
                  <span className={`text-xs font-medium ${style.text}`}>{dayTypeLabels[activeDay]}</span>
                </div>
                {nextAction ? (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="font-mono tabular-nums">{nextAction.time}</span>
                    <span>{getNextActionLabel(nextAction, scenes)}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No more actions today</span>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>
        ) : (
          <button
            onClick={() => setShowPage(true)}
            className="w-full p-4 bg-card rounded-lg border border-border hover:bg-accent transition-colors text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Plus className="h-4 w-4" />
                <span>Create Schedule</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>
        )}
      </div>

      {showPage && (
        <SchedulePage
          slug={slug}
          deviceName={deviceName}
          scenes={scenes}
          sseScheduleState={sseScheduleState}
          onClose={() => setShowPage(false)}
        />
      )}
    </>
  );
}
