export function loadData<T>(key: string, fallback: T[]): T[] {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(`ativa_${key}`)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

export function saveData<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(`ativa_${key}`, JSON.stringify(data))
}

export function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}
