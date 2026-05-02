import { useState, useEffect } from 'react';
import { Battery, Sun, Moon, Wifi, WifiOff, Play, Pause, Home, Wind, Droplets, AlertCircle, Clock, MapPin, LogOut, ChevronRight } from 'lucide-react';
import { useSSE } from '@/hooks/useSSE';
import { pauseCleaning, dockVacuum, getAuthStatus, logout, fetchDevices, fetchScenes, executeScene, setNotAtHome } from '@/lib/api';
import type { SceneInfo } from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';
import { formatCleanTime, formatCleanArea, formatDisplayName } from '@/types/status';
import type { DeviceSummary } from '@/types/status';
import { LoginPage } from '@/components/LoginPage';
import { DeviceSwitcher } from '@/components/DeviceSwitcher';
import { CleaningProgress } from '@/components/CleaningProgress';
import { VectorMap } from '@/components/VectorMap';
import { ScheduleSection } from '@/components/ScheduleSection';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ControlsPage } from '@/components/ControlsPage';

const activeCleaningStates = new Set([
  'cleaning', 'spot_cleaning', 'segment_cleaning', 'zoned_cleaning',
  'going_to_target', 'returning_home', 'washing_mop', 'emptying_dustbin',
  'going_to_wash_mop', 'paused',
]);

export function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [devices, setDevices] = useState<DeviceSummary[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>('');
  const { statuses, scheduleStates, isConnected, error, reconnect } = useSSE();
  const { theme, toggleTheme } = useTheme();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [scenes, setScenes] = useState<SceneInfo[]>([]);
  const [activeSceneId, setActiveSceneId] = useState<number | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [pendingScene, setPendingScene] = useState<SceneInfo | null>(null);
  const [globalNotAtHome, setGlobalNotAtHome] = useState(false);
  const [showControlsPage, setShowControlsPage] = useState(false);

  useEffect(() => {
    getAuthStatus()
      .then(s => setAuthenticated(s.authenticated))
      .catch(() => setAuthenticated(false));
  }, []);

  useEffect(() => {
    if (!authenticated || !selectedSlug) return;
    fetchScenes(selectedSlug).then(setScenes).catch(() => setScenes([]));
  }, [authenticated, selectedSlug]);

  useEffect(() => {
    if (!authenticated) return;
    fetchDevices().then(devs => {
      setDevices(devs);
      if (devs.length > 0 && !selectedSlug) {
        setSelectedSlug(devs[0].slug);
      }
    }).catch(console.error);
  }, [authenticated, selectedSlug]);

  const status = selectedSlug ? statuses[selectedSlug] : undefined;
  const isEmptyStatus = status ? !status.state : false;
  const isCleaning = status ? activeCleaningStates.has(status.state) : false;

  // Track global not-at-home from any SSE schedule state
  useEffect(() => {
    const states = Object.values(scheduleStates);
    if (states.length > 0) {
      setGlobalNotAtHome(states[0].not_at_home);
    }
  }, [scheduleStates]);

  // Clear active scene when device stops cleaning
  useEffect(() => {
    if (!isCleaning) setActiveSceneId(null);
  }, [isCleaning]);

  const handleAction = async (action: string, fn: () => Promise<void>) => {
    setActionLoading(action);
    try {
      await fn();
    } catch (err) {
      console.error(`Failed to ${action}:`, err);
    } finally {
      setTimeout(() => setActionLoading(null), 500);
    }
  };

  const handleLogout = async () => {
    await logout();
    setShowLogoutModal(false);
    setAuthenticated(false);
  };

  if (authenticated === null) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-muted-foreground">Loading...</div>
    </div>;
  }

  if (!authenticated) {
    return <LoginPage onLogin={() => setAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Roborock</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={async () => {
                const newVal = !globalNotAtHome;
                setGlobalNotAtHome(newVal);
                try { await setNotAtHome(newVal); } catch { setGlobalNotAtHome(!newVal); }
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-accent transition-colors"
              aria-label="Toggle not at home"
              title={globalNotAtHome ? 'Away from home (click to set at home)' : 'At home (click to set away)'}
            >
              <Home className={`h-4 w-4 ${globalNotAtHome ? 'text-gray-500' : 'text-foreground'}`} />
              <div className={`relative w-8 h-[18px] rounded-full transition-colors ${globalNotAtHome ? 'bg-gray-500' : 'bg-green-500'}`}>
                <div className={`absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white transition-transform ${globalNotAtHome ? 'left-[16px]' : 'left-[2px]'}`} />
              </div>
            </button>
            <div className="p-2" title={isConnected ? 'Connected' : 'Disconnected'}>
              {isConnected ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500 cursor-pointer" onClick={reconnect} />
              )}
            </div>
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-accent transition-colors" aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="h-5 w-5 text-foreground" /> : <Moon className="h-5 w-5 text-foreground" />}
            </button>
            <button onClick={() => setShowLogoutModal(true)} className="p-2 rounded-lg hover:bg-accent transition-colors" aria-label="Logout" title="Logout">
              <LogOut className="h-5 w-5 text-foreground" />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
            {error}
            <button onClick={reconnect} className="ml-2 underline hover:no-underline">Retry</button>
          </div>
        )}

        {/* Device Switcher */}
        <DeviceSwitcher devices={devices} selected={selectedSlug} onSelect={setSelectedSlug} />

        {/* Cleaning progress or status card */}
        {status && isEmptyStatus ? (
          <div className="mb-6 p-4 bg-card rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">Waiting for status...</p>
          </div>
        ) : status && activeCleaningStates.has(status.state) ? (
          <CleaningProgress status={status} />
        ) : status && (
          <div className="mb-6 p-4 bg-card rounded-lg border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-medium text-foreground">
                {formatDisplayName(status.state)}
              </div>
              {status.error_code > 0 && (
                <div className="flex items-center gap-1 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{status.error || `Error ${status.error_code}`}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Battery className={`h-4 w-4 ${status.battery > 50 ? 'text-green-500' : status.battery > 20 ? 'text-amber-500' : 'text-red-500'}`} />
                <span className="text-muted-foreground tabular-nums">{status.battery}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-foreground" />
                <span className="text-muted-foreground">{formatDisplayName(status.fan_speed)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-foreground" />
                <span className="text-muted-foreground">{formatDisplayName(status.mop_mode)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-foreground" />
                <span className="text-muted-foreground tabular-nums">{formatCleanTime(status.clean_time)}</span>
              </div>
              {status.clean_area > 0 && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-foreground" />
                  <span className="text-muted-foreground tabular-nums">{formatCleanArea(status.clean_area)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Inline Pause/Dock during cleaning */}
        {selectedSlug && isCleaning && (
          <div className="mb-6 grid grid-cols-2 gap-3">
            <button onClick={() => handleAction('pause', () => pauseCleaning(selectedSlug))} disabled={actionLoading === 'pause'} className="p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors touch-target flex items-center justify-center gap-2">
              <Pause className="h-5 w-5 text-amber-500" /><span className="text-sm text-muted-foreground">Pause</span>
            </button>
            <button onClick={() => handleAction('dock', () => dockVacuum(selectedSlug))} disabled={actionLoading === 'dock'} className="p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors touch-target flex items-center justify-center gap-2">
              <Home className="h-5 w-5 text-primary" /><span className="text-sm text-muted-foreground">Dock</span>
            </button>
          </div>
        )}

        {/* Programs */}
        {selectedSlug && scenes.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Programs</h2>
            <div className="space-y-2">
              {scenes.map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => setPendingScene(scene)}
                  disabled={actionLoading?.startsWith('scene-') ?? false}
                  className={`w-full p-3 rounded-lg border-2 transition-all touch-target flex items-center justify-between ${
                    activeSceneId === scene.id && isCleaning
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:bg-accent'
                  }`}
                >
                  <span className={`text-sm ${activeSceneId === scene.id && isCleaning ? 'text-primary font-medium' : 'text-foreground'}`}>{scene.name}</span>
                  {activeSceneId === scene.id && isCleaning
                    ? <span className="text-xs uppercase tracking-wide bg-primary text-primary-foreground px-2 py-0.5 rounded">Active</span>
                    : <Play className="h-4 w-4 text-green-500" />
                  }
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Controls summary card */}
        {selectedSlug && status && !isEmptyStatus && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Controls</h2>
            <button
              onClick={() => setShowControlsPage(true)}
              className="w-full p-4 bg-card rounded-lg border border-border hover:bg-accent transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Wind className="h-4 w-4" />
                    <span>{formatDisplayName(status.fan_speed)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Droplets className="h-4 w-4" />
                    <span>{formatDisplayName(status.mop_mode)}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          </div>
        )}

        {/* Schedule */}
        {selectedSlug && (
          <ScheduleSection
            slug={selectedSlug}
            deviceName={devices.find(d => d.slug === selectedSlug)?.name ?? selectedSlug}
            scenes={scenes}
            sseScheduleState={scheduleStates[selectedSlug]}
          />
        )}

        {/* Map */}
        {selectedSlug && <VectorMap slug={selectedSlug} isCleaning={status?.in_cleaning ?? false} />}

        <div className="mt-8 text-center text-xs text-muted-foreground">roborock-mqtt</div>
      </div>

      {showControlsPage && selectedSlug && (
        <ControlsPage
          slug={selectedSlug}
          status={status}
          actionLoading={actionLoading}
          onAction={handleAction}
          onClose={() => setShowControlsPage(false)}
        />
      )}

      <ConfirmModal
        open={showLogoutModal}
        title="Log out"
        message="You are about to log out from Roborock. You will need to re-authenticate with a verification code sent to your email."
        confirmLabel="Log out"
        confirmVariant="destructive"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

      <ConfirmModal
        open={pendingScene !== null}
        title={`Start "${pendingScene?.name}"?`}
        message="This will start the cleaning program on the device."
        confirmLabel="Start"
        onConfirm={() => {
          if (pendingScene) {
            setActiveSceneId(pendingScene.id);
            handleAction(`scene-${pendingScene.id}`, () => executeScene(selectedSlug, pendingScene.id));
          }
          setPendingScene(null);
        }}
        onCancel={() => setPendingScene(null)}
      />
    </div>
  );
}
