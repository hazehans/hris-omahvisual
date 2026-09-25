const BRAND_KEY = 'liquid-glass-brand'

export function readStoredBrand(fallback: string): string {
  try {
    return window.localStorage.getItem(BRAND_KEY) || fallback
  } catch {
    return fallback
  }
}

export function writeStoredBrand(value: string): void {
  try {
    window.localStorage.setItem(BRAND_KEY, value)
  } catch {
    // ignore storage failures
  }
}
