import type { DeviceSummary } from '@/types/status';

export const API_BASE = import.meta.env.DEV ? 'http://localhost:8080/api' : '/api';

export interface AuthStatus {
  authenticated: boolean;
  user?: string;
  devices?: number;
}

export async function getAuthStatus(): Promise<AuthStatus> {
  const response = await fetch(`${API_BASE}/auth/status`);
  if (!response.ok) throw new Error('Failed to get auth status');
  return response.json();
}

export async function requestCode(): Promise<void> {
  const response = await fetch(`${API_BASE}/auth/request-code`, { method: 'POST' });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to request code');
  }
}

export async function loginWithCode(code: string): Promise<AuthStatus> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
}

export async function fetchDevices(): Promise<DeviceSummary[]> {
  const response = await fetch(`${API_BASE}/devices`);
  if (!response.ok) throw new Error('Failed to fetch devices');
  return response.json();
}

export async function startCleaning(slug: string): Promise<void> {
  const response = await fetch(`${API_BASE}/devices/${slug}/start`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to start');
}

export async function pauseCleaning(slug: string): Promise<void> {
  const response = await fetch(`${API_BASE}/devices/${slug}/pause`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to pause');
}

export async function dockVacuum(slug: string): Promise<void> {
  const response = await fetch(`${API_BASE}/devices/${slug}/dock`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to dock');
}

export async function setFanSpeed(slug: string, speed: string): Promise<void> {
  const response = await fetch(`${API_BASE}/devices/${slug}/fan-speed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ speed }),
  });
  if (!response.ok) throw new Error('Failed to set fan speed');
}

export async function setMopMode(slug: string, mode: string): Promise<void> {
  const response = await fetch(`${API_BASE}/devices/${slug}/mop-mode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }),
  });
  if (!response.ok) throw new Error('Failed to set mop mode');
}

export interface SceneInfo {
  id: number;
  name: string;
}

export async function fetchScenes(slug: string): Promise<SceneInfo[]> {
  const response = await fetch(`${API_BASE}/devices/${slug}/scenes`);
  if (!response.ok) throw new Error('Failed to fetch scenes');
  return response.json();
}

export async function executeScene(slug: string, sceneId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/devices/${slug}/scenes/${sceneId}/execute`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to execute scene');
}

// --- Schedule ---

import type { ScheduleResponse, DeviceSchedule } from '@/types/schedule';

export async function fetchSchedule(slug: string): Promise<ScheduleResponse> {
  const response = await fetch(`${API_BASE}/devices/${slug}/schedule`);
  if (!response.ok) throw new Error('Failed to fetch schedule');
  return response.json();
}

export async function fetchScheduleStatus(): Promise<any> {
  const response = await fetch(`${API_BASE}/schedule/status`);
  if (!response.ok) throw new Error('Failed to fetch schedule status');
  return response.json();
}

export async function saveSchedule(slug: string, schedule: DeviceSchedule): Promise<any> {
  const response = await fetch(`${API_BASE}/devices/${slug}/schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(schedule),
  });
  if (!response.ok) throw new Error('Failed to save schedule');
  return response.json();
}

export async function deleteSchedule(slug: string): Promise<any> {
  const response = await fetch(`${API_BASE}/devices/${slug}/schedule`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete schedule');
  return response.json();
}

export async function resetConsumable(slug: string, name: string): Promise<any> {
  const response = await fetch(`${API_BASE}/devices/${slug}/consumables/${name}/reset`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to reset consumable');
  return response.json();
}

export async function setNotAtHome(enabled: boolean): Promise<any> {
  const response = await fetch(`${API_BASE}/not-at-home`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  });
  if (!response.ok) throw new Error('Failed to update not-at-home');
  return response.json();
}
