import { useState, useEffect, useMemo } from 'react'
import { Routes, Route, Navigate, Outlet, useParams, useNavigate, Link } from 'react-router-dom'
import {
  AlertCircle,
  CalendarClock,
  ChevronRight,
  CircleDot,
  Clock,
  Droplets,
  Home,
  LogOut,
  MapPin,
  Pause,
  Play,
  SlidersHorizontal,
  Wind,
  Wrench,
} from 'lucide-react'
import { useSSE } from '@/hooks/useSSE'
import {
  pauseCleaning,
  dockVacuum,
  getAuthStatus,
  logout,
  fetchDevices,
  fetchScenes,
  executeScene,
  setNotAtHome,
} from '@/lib/api'
import type { SceneInfo } from '@/lib/api'
import { areaM2 } from '@/types/status'
import type { DeviceSummary, VacuumStatus } from '@/types/status'
import type { ScheduleState } from '@/types/schedule'
import { LangSwitch as BaseLangSwitch, useI18n, type Key } from '@/lib/i18n'
import { LoginPage } from '@/components/LoginPage'
import { CleaningProgress } from '@/components/CleaningProgress'
import { VectorMap } from '@/components/VectorMap'
import { ScheduleRow } from '@/components/ScheduleSection'
import { ConfirmModal, SecTitle, Stat, levelClass } from '@/components/ui'
import { ControlsPage } from '@/components/ControlsPage'
import { MaintenancePage, consumableKeys } from '@/components/MaintenancePage'
import { SchedulePage } from '@/components/SchedulePage'
import { batteryClass, stateClass } from '@/components/state'

const activeCleaningStates = new Set([
  'cleaning',
  'spot_cleaning',
  'segment_cleaning',
  'zoned_cleaning',
  'going_to_target',
  'returning_home',
  'washing_mop',
  'emptying_dustbin',
  'going_to_wash_mop',
  'paused',
])

export function App() {
  const { t } = useI18n()
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [devices, setDevices] = useState<DeviceSummary[]>([])
  const { statuses, scheduleStates, availabilities, isConnected, error, reconnect } = useSSE()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [scenesBySlug, setScenesBySlug] = useState<Record<string, SceneInfo[]>>({})
  const [activeSceneId, setActiveSceneId] = useState<number | null>(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [pendingScene, setPendingScene] = useState<SceneInfo | null>(null)
  const [pendingSceneSlug, setPendingSceneSlug] = useState<string>('')
  const [globalNotAtHome, setGlobalNotAtHome] = useState(false)

  useEffect(() => {
    getAuthStatus()
      .then((s) => setAuthenticated(s.authenticated))
      .catch(() => setAuthenticated(false))
  }, [])

  useEffect(() => {
    if (!authenticated) return
    fetchDevices()
      .then((devs) => {
        const list = devs ?? []
        setDevices(list)
        list.forEach((dev) => {
          fetchScenes(dev.slug)
            .then((scenes) => setScenesBySlug((prev) => ({ ...prev, [dev.slug]: scenes ?? [] })))
            .catch(() => {})
        })
      })
      .catch(console.error)
  }, [authenticated])

  useEffect(() => {
    const states = Object.values(scheduleStates)
    if (states.length > 0) setGlobalNotAtHome(states[0].not_at_home)
  }, [scheduleStates])

  // Overlay the live SSE connection state onto the fetched device list so the
  // online/offline indicator reflects cloud-connection drops without a refetch.
  const liveDevices = useMemo(
    () => devices.map((d) => (d.slug in availabilities ? { ...d, online: availabilities[d.slug] } : d)),
    [devices, availabilities],
  )

  const handleAction = async (action: string, fn: () => Promise<void>) => {
    setActionLoading(action)
    try {
      await fn()
    } catch (err) {
      console.error(`Failed to ${action}:`, err)
    } finally {
      setTimeout(() => setActionLoading(null), 500)
    }
  }

  const handleLogout = async () => {
    await logout()
    setShowLogoutModal(false)
    setAuthenticated(false)
  }

  if (authenticated === null) return <Centered>{t('loading')}</Centered>
  if (!authenticated) return <LoginPage onLogin={() => setAuthenticated(true)} />

  return (
    <>
      <Routes>
        <Route
          path="/devices/:slug/*"
          element={
            <DeviceLayout
              devices={liveDevices}
              statuses={statuses}
              globalNotAtHome={globalNotAtHome}
              setGlobalNotAtHome={setGlobalNotAtHome}
              isConnected={isConnected}
              error={error}
              reconnect={reconnect}
              onLogout={() => setShowLogoutModal(true)}
            />
          }
        >
          <Route
            index
            element={
              <DeviceHome
                statuses={statuses}
                scheduleStates={scheduleStates}
                scenesBySlug={scenesBySlug}
                activeSceneId={activeSceneId}
                actionLoading={actionLoading}
                handleAction={handleAction}
                setPendingScene={(s, slug) => {
                  setPendingScene(s)
                  setPendingSceneSlug(slug)
                }}
                setActiveSceneId={setActiveSceneId}
              />
            }
          />
          <Route
            path="controls"
            element={<ControlsRoute devices={liveDevices} statuses={statuses} actionLoading={actionLoading} handleAction={handleAction} />}
          />
          <Route path="schedule" element={<ScheduleRoute devices={liveDevices} scenesBySlug={scenesBySlug} scheduleStates={scheduleStates} />} />
          <Route path="maintenance" element={<MaintenanceRoute devices={liveDevices} statuses={statuses} />} />
        </Route>
        <Route
          path="*"
          element={devices.length > 0 ? <Navigate to={`/devices/${devices[0].slug}`} replace /> : <Centered>{t('loading.devices')}</Centered>}
        />
      </Routes>

      <ConfirmModal
        open={showLogoutModal}
        title={t('logout.title')}
        message={t('logout.message')}
        confirmLabel={t('logout')}
        destructive
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

      <ConfirmModal
        open={pendingScene !== null}
        title={t('program.confirm.title', { name: pendingScene?.name ?? '' })}
        message={t('program.confirm.message')}
        confirmLabel={t('start')}
        onConfirm={() => {
          if (pendingScene) {
            setActiveSceneId(pendingScene.id)
            handleAction(`scene-${pendingScene.id}`, () => executeScene(pendingSceneSlug, pendingScene.id))
          }
          setPendingScene(null)
        }}
        onCancel={() => setPendingScene(null)}
      />
    </>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ color: 'var(--ink-3)' }}>
      {children}
    </div>
  )
}

function LangSwitch() {
  return <BaseLangSwitch i18n={useI18n()} />
}

// --- Device layout (shared header + outlet) ---

function DeviceLayout({
  devices,
  statuses,
  globalNotAtHome,
  setGlobalNotAtHome,
  isConnected,
  error,
  reconnect,
  onLogout,
}: {
  devices: DeviceSummary[]
  statuses: Record<string, VacuumStatus>
  globalNotAtHome: boolean
  setGlobalNotAtHome: (v: boolean) => void
  isConnected: boolean
  error: string | null
  reconnect: () => void
  onLogout: () => void
}) {
  const { t } = useI18n()
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const toggleAway = async () => {
    const v = !globalNotAtHome
    setGlobalNotAtHome(v)
    try {
      await setNotAtHome(v)
    } catch {
      setGlobalNotAtHome(!v)
    }
  }

  return (
    <div className="min-h-screen">
      <header className="top-bar">
        <div className="mx-auto max-w-5xl px-safe py-2.5">
          <div className="flex items-center gap-3">
            <span className="ico">
              <CircleDot />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[17px] leading-tight font-semibold tracking-tight">{t('title')}</div>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--ink-3)' }}>
                {isConnected ? (
                  'roborock'
                ) : (
                  <>
                    <span className="dot bad" /> {t('disconnected')}
                  </>
                )}
              </div>
            </div>
            <LangSwitch />
            <button className="icon-btn -mr-2" onClick={onLogout} aria-label={t('logout')} title={t('logout')}>
              <LogOut className="size-[18px]" />
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="min-w-0 flex-1">
              {devices.length > 1 && (
                <nav className="seg nav-seg" aria-label={t('title')}>
                  {devices.map((d) => {
                    const pct = statuses[d.slug]?.clean_percent
                    return (
                      <button key={d.slug} aria-pressed={slug === d.slug} onClick={() => navigate(`/devices/${d.slug}`)}>
                        <span className={`dot ${d.online ? '' : 'bad'}`} title={d.online ? t('online') : t('offline')} />
                        {d.name}
                        {pct != null && <span className="num text-xs" style={{ color: 'var(--ink-3)' }}>{pct} %</span>}
                      </button>
                    )
                  })}
                </nav>
              )}
            </div>
            <button
              className="pill touch-target shrink-0"
              onClick={toggleAway}
              aria-pressed={globalNotAtHome}
              title={globalNotAtHome ? t('away.hint.away') : t('away.hint.home')}
            >
              <Home className="size-4" style={{ color: 'var(--ink-3)' }} />
              <span className="hidden sm:inline">{globalNotAtHome ? t('away') : t('home')}</span>
              <span className="switch" data-on={!globalNotAtHome} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-safe pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {error && (
          <div className="alert-banner">
            <span className="ico sm">
              <AlertCircle />
            </span>
            <div className="min-w-0 flex-1">
              <div className="t">{t('conn.lost')}</div>
              <div className="s">{t(error as Key)}</div>
            </div>
            <button className="btn" onClick={reconnect}>
              {t('retry')}
            </button>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  )
}

// --- Device home ---

function DeviceHome({
  statuses,
  scheduleStates,
  scenesBySlug,
  activeSceneId,
  actionLoading,
  handleAction,
  setPendingScene,
  setActiveSceneId,
}: {
  statuses: Record<string, VacuumStatus>
  scheduleStates: Record<string, ScheduleState>
  scenesBySlug: Record<string, SceneInfo[]>
  activeSceneId: number | null
  actionLoading: string | null
  handleAction: (action: string, fn: () => Promise<void>) => void
  setPendingScene: (s: SceneInfo, slug: string) => void
  setActiveSceneId: (id: number | null) => void
}) {
  const { t, tv, num, dur } = useI18n()
  const { slug = '' } = useParams<{ slug: string }>()

  const status = statuses[slug]
  const isEmptyStatus = status ? !status.state : false
  const isCleaning = status ? activeCleaningStates.has(status.state) : false
  const scenes = scenesBySlug[slug] ?? []

  // Clear the active program when the device stops cleaning.
  useEffect(() => {
    if (!isCleaning) setActiveSceneId(null)
  }, [isCleaning, setActiveSceneId])

  if (!slug) return null

  const p = status?.consumable_percents
  const worstKey = p ? consumableKeys.reduce((a, b) => (p[b] < p[a] ? b : a)) : undefined
  const worst = p && worstKey ? p[worstKey] : 100

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div className="space-y-5">
        {/* Status */}
        {!status || isEmptyStatus ? (
          <div className="card card-b text-sm" style={{ color: 'var(--ink-3)' }}>
            {t('waiting.status')}
          </div>
        ) : isCleaning ? (
          <CleaningProgress status={status} scenes={scenes} />
        ) : (
          <section className="card">
            <div className="card-h">
              <span className={`state ${stateClass(status)}`}>
                <span className="dot" /> {tv('st', status.state)}
              </span>
              {status.error_code > 0 && (
                <span className="meta flex items-center gap-1" style={{ color: 'var(--alert)' }}>
                  <AlertCircle className="size-4" />
                  {status.error || t('error.code', { code: status.error_code })}
                </span>
              )}
            </div>
            <div className="card-b">
              <div className="mb-3 flex items-baseline gap-2">
                <span className="big">{status.battery}</span>
                <span className="text-lg font-semibold" style={{ color: 'var(--ink-3)' }}>
                  % {t('battery')}
                </span>
              </div>
              <div className={`meter ${batteryClass(status.battery)}`}>
                <i style={{ width: `${Math.min(100, Math.max(0, status.battery))}%` }} />
              </div>
              <div className="stats compact mt-3" style={{ '--n': 2 } as React.CSSProperties}>
                <Stat icon={<Wind />} k={t('fan')} v={tv('fan', status.fan_speed)} />
                <Stat icon={<Droplets />} k={t('mop')} v={tv('mop', status.mop_mode)} />
                <Stat icon={<Clock />} k={t('last.clean')} v={dur(status.clean_time)} />
                <Stat icon={<MapPin />} k={t('area')} v={status.clean_area > 0 ? `${num(areaM2(status.clean_area), 1)} m²` : '–'} />
              </div>
            </div>
          </section>
        )}

        {/* Pause / dock while cleaning */}
        {isCleaning && (
          <div className="grid grid-cols-2 gap-2.5">
            <button className="btn" onClick={() => handleAction('pause', () => pauseCleaning(slug))} disabled={actionLoading === 'pause'}>
              <Pause className="size-[18px]" /> {t('pause')}
            </button>
            <button className="btn" onClick={() => handleAction('dock', () => dockVacuum(slug))} disabled={actionLoading === 'dock'}>
              <Home className="size-[18px]" /> {t('dock')}
            </button>
          </div>
        )}

        {/* Programs */}
        {scenes.length > 0 && (
          <section>
            <SecTitle>{t('programs')}</SecTitle>
            <div className="card px-4 py-1.5">
              <ul className="list">
                {scenes.map((scene) => {
                  const active = activeSceneId === scene.id && isCleaning
                  return (
                    <li key={scene.id}>
                      <button
                        className="row-link"
                        onClick={() => setPendingScene(scene, slug)}
                        disabled={actionLoading?.startsWith('scene-') ?? false}
                      >
                        <span className="ico sm" style={active ? undefined : ({ '--c': 'var(--ink-3)' } as React.CSSProperties)}>
                          <Play />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="t block truncate">{scene.name}</span>
                          {scene.recorded_minutes != null && <span className="s num block">~{scene.recorded_minutes} min</span>}
                        </span>
                        {active && (
                          <span className="state ok">
                            <span className="dot live" /> {t('program.active')}
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </section>
        )}

        {/* Settings: controls, maintenance, schedule */}
        {status && !isEmptyStatus && (
          <section>
            <SecTitle>{t('settings')}</SecTitle>
            <div className="card px-4 py-1.5">
              <ul className="list">
                <li>
                  <Link to={`/devices/${slug}/controls`} className="row-link">
                    <span className="ico sm">
                      <SlidersHorizontal />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="t block">{t('controls')}</span>
                      <span className="s block truncate">
                        {t('fan')}: {tv('fan', status.fan_speed)} · {t('mop')}: {tv('mop', status.mop_mode)}
                      </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0" style={{ color: 'var(--ink-4)' }} />
                  </Link>
                </li>
                {p && worstKey && (
                  <li>
                    <Link to={`/devices/${slug}/maintenance`} className="row-link">
                      <span className="ico sm">
                        <Wrench />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="t block">{t('maintenance')}</span>
                        <span className="s block truncate">
                          {worst > 50 ? t('maint.ok') : `${tv('c', worstKey)}: ${worst} %`}
                        </span>
                      </span>
                      {worst <= 50 && <span className={`dot ${levelClass(worst)}`} />}
                      <ChevronRight className="size-4 shrink-0" style={{ color: 'var(--ink-4)' }} />
                    </Link>
                  </li>
                )}
                <li>
                  <ScheduleRow slug={slug} scenes={scenes} sseScheduleState={scheduleStates[slug]} icon={<CalendarClock />} />
                </li>
              </ul>
            </div>
          </section>
        )}
      </div>

      {/* Map */}
      <VectorMap slug={slug} isCleaning={status?.in_cleaning ?? false} />
    </div>
  )
}

// --- Route wrappers for sub-pages ---

function deviceName(devices: DeviceSummary[], slug: string) {
  return devices.find((d) => d.slug === slug)?.name ?? slug
}

function ControlsRoute({
  devices,
  statuses,
  actionLoading,
  handleAction,
}: {
  devices: DeviceSummary[]
  statuses: Record<string, VacuumStatus>
  actionLoading: string | null
  handleAction: (action: string, fn: () => Promise<void>) => void
}) {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  if (!slug) return null
  return (
    <ControlsPage
      slug={slug}
      deviceName={deviceName(devices, slug)}
      status={statuses[slug]}
      actionLoading={actionLoading}
      onAction={handleAction}
      onClose={() => navigate(`/devices/${slug}`)}
    />
  )
}

function ScheduleRoute({
  devices,
  scenesBySlug,
  scheduleStates,
}: {
  devices: DeviceSummary[]
  scenesBySlug: Record<string, SceneInfo[]>
  scheduleStates: Record<string, ScheduleState>
}) {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  if (!slug) return null
  return (
    <SchedulePage
      slug={slug}
      deviceName={deviceName(devices, slug)}
      scenes={scenesBySlug[slug] ?? []}
      sseScheduleState={scheduleStates[slug]}
      onClose={() => navigate(`/devices/${slug}`)}
    />
  )
}

function MaintenanceRoute({ devices, statuses }: { devices: DeviceSummary[]; statuses: Record<string, VacuumStatus> }) {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  if (!slug) return null
  const status = statuses[slug]
  if (!status?.consumable_percents || !status.consumables) return null
  return (
    <MaintenancePage
      slug={slug}
      deviceName={deviceName(devices, slug)}
      percents={status.consumable_percents}
      consumables={status.consumables}
      onClose={() => navigate(`/devices/${slug}`)}
    />
  )
}
