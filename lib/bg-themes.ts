export type BgThemeKey = 'purple_original' | 'navy_gold' | 'emerald_black' | 'burgundy_black' | 'indigo_black'

export interface BgTheme {
  key: BgThemeKey
  name: string
  gradient: string
  previewColors: [string, string, string]
}

export const BG_THEMES: Record<BgThemeKey, BgTheme> = {
  purple_original: {
    key: 'purple_original',
    name: '보라',
    gradient: 'radial-gradient(130% 100% at 50% 0%, #3a1d52 0%, #2a1342 38%, #1a0d2e 72%, #0d0719 100%)',
    previewColors: ['#3a1d52', '#1a0d2e', '#0d0719'],
  },
  navy_gold: {
    key: 'navy_gold',
    name: '딥 네이비',
    gradient: 'radial-gradient(130% 100% at 50% 0%, #1a2a60 0%, #0a1540 38%, #05091e 72%, #020410 100%)',
    previewColors: ['#1a2a60', '#0a1540', '#020410'],
  },
  emerald_black: {
    key: 'emerald_black',
    name: '딥 에메랄드',
    gradient: 'radial-gradient(130% 100% at 50% 0%, #0d3320 0%, #071a10 38%, #040f0a 72%, #010604 100%)',
    previewColors: ['#0d3320', '#071a10', '#010604'],
  },
  burgundy_black: {
    key: 'burgundy_black',
    name: '딥 버건디',
    gradient: 'radial-gradient(130% 100% at 50% 0%, #2d0010 0%, #1a0008 38%, #0d0005 72%, #050002 100%)',
    previewColors: ['#2d0010', '#1a0008', '#050002'],
  },
  indigo_black: {
    key: 'indigo_black',
    name: '딥 인디고',
    gradient: 'radial-gradient(130% 100% at 50% 0%, #0b0f3a 0%, #070b2e 38%, #040718 72%, #010209 100%)',
    previewColors: ['#0b0f3a', '#070b2e', '#010209'],
  },
}

export const LANDING_BG_KEY = 'landing_bg_theme'
export const ROULETTE_BG_KEY = 'roulette_bg_theme'

export function getSavedBg(storageKey: string): BgThemeKey {
  if (typeof window === 'undefined') return storageKey === LANDING_BG_KEY ? 'emerald_black' : 'purple_original'
  const saved = localStorage.getItem(storageKey) as BgThemeKey
  const defaultKey: BgThemeKey = storageKey === LANDING_BG_KEY ? 'emerald_black' : 'purple_original'
  return (saved && saved in BG_THEMES) ? saved : defaultKey
}

export function saveBg(storageKey: string, key: BgThemeKey) {
  localStorage.setItem(storageKey, key)
}
