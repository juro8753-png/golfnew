export const LIMITS_STORAGE_KEY = 'daily_participation_limits'

// '_default' is a special key for the global fallback limit
type Limits = Record<string, number>

function load(): Limits {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(LIMITS_STORAGE_KEY) || '{}') } catch { return {} }
}

function save(limits: Limits): void {
  localStorage.setItem(LIMITS_STORAGE_KEY, JSON.stringify(limits))
  // Notify other tabs
  window.dispatchEvent(new StorageEvent('storage', { key: LIMITS_STORAGE_KEY }))
}

export function getAllLimits(): Limits {
  return load()
}

export function setDateLimit(date: string, limit: number | null): void {
  const l = load()
  if (limit === null) delete l[date]
  else l[date] = limit
  save(l)
}

export function setDateRangeLimit(startDate: string, days: number, limit: number | null): void {
  const l = load()
  const d = new Date(startDate + 'T12:00:00')
  for (let i = 0; i < days; i++) {
    const key = d.toISOString().slice(0, 10)
    if (limit === null) delete l[key]
    else l[key] = limit
    d.setDate(d.getDate() + 1)
  }
  save(l)
}

export function setDefaultLimit(limit: number | null): void {
  const l = load()
  if (limit === null) delete l['_default']
  else l['_default'] = limit
  save(l)
}

export function getEffectiveLimit(date: string): number | null {
  const l = load()
  if (l[date] !== undefined) return l[date]
  if (l['_default'] !== undefined) return l['_default']
  return null // unlimited
}

export function resetAllLimits(): void {
  localStorage.removeItem(LIMITS_STORAGE_KEY)
  window.dispatchEvent(new StorageEvent('storage', { key: LIMITS_STORAGE_KEY }))
}
