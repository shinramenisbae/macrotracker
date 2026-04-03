import type { FoodEntry, FoodItem, Goals, DailySummary, WeightEntry, AnalyzeResponse } from '../types';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

// Food analysis
export async function analyzePhoto(imageBase64: string): Promise<AnalyzeResponse> {
  return request('/analyze', {
    method: 'POST',
    body: JSON.stringify({ image: imageBase64 }),
  });
}

export async function lookupBarcode(code: string): Promise<{ product: FoodItem }> {
  return request(`/barcode/${code}`);
}

// Entries
export async function getEntries(date: string): Promise<{ entries: FoodEntry[] }> {
  return request(`/entries?date=${date}`);
}

export async function createEntry(entry: Partial<FoodEntry>): Promise<{ entry: FoodEntry }> {
  return request('/entries', {
    method: 'POST',
    body: JSON.stringify(entry),
  });
}

export async function updateEntry(id: number, entry: Partial<FoodEntry>): Promise<{ entry: FoodEntry }> {
  return request(`/entries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(entry),
  });
}

export async function deleteEntry(id: number): Promise<{ success: boolean }> {
  return request(`/entries/${id}`, { method: 'DELETE' });
}

// Goals
export async function getGoals(): Promise<{ goals: Goals }> {
  return request('/goals');
}

export async function updateGoals(goals: Partial<Goals>): Promise<{ goals: Goals }> {
  return request('/goals', {
    method: 'PUT',
    body: JSON.stringify(goals),
  });
}

// Summary
export async function getSummary(date: string): Promise<{ totals: DailySummary }> {
  return request(`/summary?date=${date}`);
}

// Weight
export async function getWeightHistory(days = 30): Promise<{ entries: WeightEntry[] }> {
  return request(`/weight?days=${days}`);
}

export async function logWeight(weight_kg: number, date?: string, notes?: string, photo?: string): Promise<{ entry: WeightEntry }> {
  return request('/weight', {
    method: 'POST',
    body: JSON.stringify({ weight_kg, date, notes, photo }),
  });
}

export async function deleteWeight(id: number): Promise<{ success: boolean }> {
  return request(`/weight/${id}`, { method: 'DELETE' });
}

// History (batch)
export interface HistoryResponse {
  summaryMap: Record<string, DailySummary & { date: string; entry_count: number }>;
  entryMap: Record<string, FoodEntry[]>;
  today: string;
}

export async function getHistory(days = 14, today?: string): Promise<HistoryResponse> {
  const params = new URLSearchParams({ days: String(days) });
  if (today) params.set('today', today);
  return request(`/summary/history?${params}`);
}
