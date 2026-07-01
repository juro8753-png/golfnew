export type ThemeKey = 'standard' | 'royal_gold' | 'burgundy_cream' | 'sapphire_platinum' | 'emerald_ivory' | 'neon_purple' | 'fortune_gold' | 'fortune_wheel_classic'

export interface WheelThemeConfig {
  key: ThemeKey
  name: string
  rimFill: string
  rimRingColor: string
  neonGlow?: boolean
  hubPulse?: boolean
  segGradient?: boolean
  segEvenFillBright?: string
  segEvenFillDark?: string
  segOddFillBright?: string
  segOddFillDark?: string
  useCustomSegColors: boolean
  segEvenFill: string
  segOddFill: string
  segEvenText: string
  segOddText: string
  dividerColor: string
  dividerWidth: number
  bulbOnColor: string
  bulbOffColor: string
  bulbGlowColor: string
  hubOuterFill: string
  hubInnerFill: string
  hubInnerStroke: string
  hubTintColor?: string
  hubRingColor?: string
  // 미리보기용 색상
  previewColors: [string, string, string]
}

export const WHEEL_THEMES: Record<ThemeKey, WheelThemeConfig> = {
  fortune_wheel_classic: {
    key: 'fortune_wheel_classic',
    name: '포춘 클래식',
    rimFill: '#470d0d',
    rimRingColor: '#c89a36',
    useCustomSegColors: false,
    segEvenFill: '#df3a34',
    segOddFill: '#f3e7ca',
    segEvenText: '#fdf3df',
    segOddText: '#c1271f',
    dividerColor: '#c89a36',
    dividerWidth: 2.5,
    bulbOnColor: '#ffc63f',
    bulbOffColor: '#ffe07a',
    bulbGlowColor: '#ffc63f',
    hubOuterFill: '#fdeea4',
    hubInnerFill: '#f4e2a0',
    hubInnerStroke: '#c89a36',
    previewColors: ['#470d0d', '#df3a34', '#f3e7ca'],
  },
  burgundy_cream: {
    key: 'burgundy_cream',
    name: '버건디 크림',
    rimFill: '#1a0008',
    rimRingColor: '#caa24a',
    segGradient: true,
    segEvenFillBright: '#FFFFFF',
    segEvenFillDark:   '#C8A870',
    segOddFillBright:  '#FF7090',
    segOddFillDark:    '#6A0820',
    useCustomSegColors: false,
    segEvenFill: '#fff7e2',
    segOddFill: '#c8415e',
    segEvenText: '#c0243f',
    segOddText: '#fffbe8',
    dividerColor: '#e9c069',
    dividerWidth: 2.5,
    bulbOnColor: '#ffe9a8',
    bulbOffColor: '#7a4030',
    bulbGlowColor: '#ffe9a8',
    hubOuterFill: '#1c0010',
    hubInnerFill: '#fffdf5',
    hubInnerStroke: '#caa24a',
    hubTintColor: 'rgba(180, 30, 60, 0.32)',
    hubRingColor: '#c8415e',
    previewColors: ['#1a0008', '#fff7e2', '#c8415e'],
  },
  standard: {
    key: 'standard',
    name: '일반',
    rimFill: '#1a3a1a',
    rimRingColor: 'none',
    useCustomSegColors: true,
    segEvenFill: '',
    segOddFill: '',
    segEvenText: '#ffffff',
    segOddText: '#ffffff',
    dividerColor: '#ffffff',
    dividerWidth: 2,
    bulbOnColor: '#FFD700',
    bulbOffColor: '#2a1800',
    bulbGlowColor: '#FFD700',
    hubOuterFill: '#1a3a1a',
    hubInnerFill: '#ffffff',
    hubInnerStroke: '#ffffff',
    previewColors: ['#1a3a1a', '#4CAF50', '#2196F3'],
  },
  royal_gold: {
    key: 'royal_gold',
    name: '로열골드',
    rimFill: '#1e1030',
    rimRingColor: '#F2D870',
    segGradient: true,
    segEvenFillBright: '#D8C0FF',
    segEvenFillDark:   '#300870',
    segOddFillBright:  '#FFE860',
    segOddFillDark:    '#7A5000',
    useCustomSegColors: false,
    segEvenFill: '#A080E0',
    segOddFill: '#F0C030',
    segEvenText: '#ffffff',
    segOddText: '#ffffff',
    dividerColor: '#F2D870',
    dividerWidth: 2.5,
    bulbOnColor: '#F2D870',
    bulbOffColor: '#5a3e10',
    bulbGlowColor: '#F2D870',
    hubOuterFill: '#1e1030',
    hubInnerFill: '#fffdf5',
    hubInnerStroke: '#F2D870',
    previewColors: ['#1e1030', '#A080E0', '#F0C030'],
  },
  sapphire_platinum: {
    key: 'sapphire_platinum',
    name: '사파이어',
    rimFill: '#0c1a36',
    rimRingColor: '#caa24a',
    useCustomSegColors: false,
    segEvenFill: '#2f6fd6',
    segOddFill: '#eaf1fb',
    segEvenText: '#eaf3ff',
    segOddText: '#1c4e9e',
    dividerColor: '#caa24a',
    dividerWidth: 2.5,
    bulbOnColor: '#ffe9a8',
    bulbOffColor: '#caa24a',
    bulbGlowColor: '#ffe9a8',
    hubOuterFill: '#10131c',
    hubInnerFill: '#ffffff',
    hubInnerStroke: '#9db6d6',
    hubTintColor: 'rgba(40, 100, 210, 0.32)',
    hubRingColor: '#2f6fd6',
    previewColors: ['#0c1a36', '#2f6fd6', '#eaf1fb'],
  },
  emerald_ivory: {
    key: 'emerald_ivory',
    name: '에메랄드',
    rimFill: '#0a2519',
    rimRingColor: '#d99a5e',
    useCustomSegColors: false,
    segEvenFill: '#1f7a52',
    segOddFill: '#f7f0d8',
    segEvenText: '#f3fff6',
    segOddText: '#1d6a46',
    dividerColor: '#b8743a',
    dividerWidth: 2.5,
    bulbOnColor: '#f8dcb8',
    bulbOffColor: '#d99a5e',
    bulbGlowColor: '#f8dcb8',
    hubOuterFill: '#10131c',
    hubInnerFill: '#fffdf5',
    hubInnerStroke: '#caa24a',
    hubTintColor: 'rgba(20, 110, 65, 0.32)',
    hubRingColor: '#1f7a52',
    previewColors: ['#0a2519', '#1f7a52', '#f7f0d8'],
  },
  fortune_gold: {
    key: 'fortune_gold',
    name: '포춘 골드',
    rimFill: '#1a1200',
    rimRingColor: '#D4A520',
    hubPulse: true,
    segGradient: true,
    segEvenFillBright: '#FFFFFF',
    segEvenFillDark:   '#C8A050',
    segOddFillBright:  '#FF9898',
    segOddFillDark:    '#8B1010',
    useCustomSegColors: false,
    segEvenFill: '#F0DDB0',
    segOddFill: '#8B1515',
    segEvenText: '#5A0000',
    segOddText: '#FFFFFF',
    dividerColor: '#D4A520',
    dividerWidth: 2.5,
    bulbOnColor: '#FFD700',
    bulbOffColor: '#6B3A00',
    bulbGlowColor: '#FFD700',
    hubOuterFill: '#c88a00',
    hubInnerFill: '#ffe080',
    hubInnerStroke: '#D4A520',
    previewColors: ['#2a0808', '#F0DDB0', '#8B1515'],
  },
  neon_purple: {
    key: 'neon_purple',
    name: '네온 퍼플',
    rimFill: '#0e0520',
    rimRingColor: '#c040ff',
    neonGlow: true,
    segGradient: true,
    segEvenFillBright: '#4060E0',
    segEvenFillDark:   '#040818',
    segOddFillBright:  '#C060FF',
    segOddFillDark:    '#1A0430',
    useCustomSegColors: false,
    segEvenFill: '#0e1878',
    segOddFill: '#4a0f7a',
    segEvenText: '#ffffff',
    segOddText: '#ffffff',
    dividerColor: '#7030c0',
    dividerWidth: 2,
    bulbOnColor: '#ff40ff',
    bulbOffColor: '#2a0840',
    bulbGlowColor: '#ff40ff',
    hubOuterFill: '#1a0632',
    hubInnerFill: '#e0c0ff',
    hubInnerStroke: '#c040ff',
    previewColors: ['#0e0520', '#0e1878', '#4a0f7a'],
  },
}

export const THEME_STORAGE_KEY = 'wheel_theme'

export function getSavedTheme(): ThemeKey {
  if (typeof window === 'undefined') return 'fortune_wheel_classic'
  const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeKey
  return (saved && saved in WHEEL_THEMES) ? saved : 'fortune_wheel_classic'
}

export function saveTheme(key: ThemeKey) {
  localStorage.setItem(THEME_STORAGE_KEY, key)
}
