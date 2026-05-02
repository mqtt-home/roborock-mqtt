export type DayType = 'normal' | 'weekend' | 'free' | 'notAtHome';

export interface TimeSlot {
  time: string;
  action: string;
  scene_id?: number;
}

export interface DeviceSchedule {
  normal?: TimeSlot[];
  weekend?: TimeSlot[];
  free?: TimeSlot[];
  notAtHome?: TimeSlot[];
}

export interface NextAction {
  time: string;
  action: string;
  scene_id?: number;
}

export type ScheduleSource = 'provisioned' | 'user' | 'none';

export interface ScheduleState {
  device: string;
  source: ScheduleSource;
  active_day: DayType;
  not_at_home: boolean;
  holiday: boolean;
  vacation: boolean;
  next_action?: NextAction;
}

export interface ScheduleResponse {
  configured: boolean;
  source: ScheduleSource;
  state?: ScheduleState;
  schedule?: DeviceSchedule;
}

export interface ScheduleSSEEvent {
  type: 'schedule';
  device: string;
  state: ScheduleState;
}

export const dayTypeLabels: Record<DayType, string> = {
  normal: 'Normal',
  weekend: 'Weekend',
  free: 'Free Day',
  notAtHome: 'Not at Home',
};
