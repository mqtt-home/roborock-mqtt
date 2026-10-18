import type { VacuumStatus } from '@/types/status'

const busy = new Set(['cleaning', 'spot_cleaning', 'segment_cleaning', 'zoned_cleaning', 'mapping'])
const moving = new Set(['returning_home', 'going_to_target', 'going_to_wash_mop', 'docking', 'washing_mop', 'emptying_dustbin', 'starting'])
const broken = new Set(['error', 'charging_problem', 'charger_disconnected'])

/** State badge colour: colour only ever means state. */
export function stateClass(status: VacuumStatus): string {
  if (status.error_code > 0 || broken.has(status.state)) return 'bad'
  if (busy.has(status.state)) return 'ok'
  if (moving.has(status.state)) return 'info'
  if (status.state === 'paused') return 'warn'
  if (status.state === 'charging') return 'accent'
  return ''
}

/** Whether the state badge's dot should pulse. */
export function isLive(status: VacuumStatus): boolean {
  return busy.has(status.state) || moving.has(status.state)
}

/** Battery level -> meter class; only a low battery is coloured. */
export function batteryClass(pct: number): '' | 'warn' | 'bad' {
  if (pct <= 15) return 'bad'
  if (pct <= 30) return 'warn'
  return ''
}
