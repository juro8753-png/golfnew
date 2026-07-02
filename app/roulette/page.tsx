'use client'

import { useEffect, useState, useCallback } from 'react'
import RouletteWheel from '@/components/RouletteWheel'
import FireworksBackground from '@/components/FireworksBackground'
import SparklesOverlay from '@/components/SparklesOverlay'
import SunRaysEffect from '@/components/SunRaysEffect'
import { Prize } from '@/types'
import { BG_THEMES, getSavedBg, ROULETTE_BG_KEY } from '@/lib/bg-themes'
import { soundEngine } from '@/lib/sounds'

export default function Home() {
  const [prizes, setPrizes] = useState<Prize[]>(() => {
    try {
      const cached = sessionStorage.getItem('prizes_cache')
      if (cached) return JSON.parse(cached) as Prize[]
    } catch {}
    return []
  })
  const [loading, setLoading] = useState(() => {
    try { return !sessionStorage.getItem('prizes_cache') } catch { return true }
  })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [bgGradient, setBgGradient] = useState(BG_THEMES.indigo_black.gradient)

  const fetchPrizes = useCallback(async () => {
    try {
      const res = await fetch('/api/prizes')
      const data = await res.json()
      if (Array.isArray(data)) {
        setPrizes(data)
        sessionStorage.setItem('prizes_cache', JSON.stringify(data))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPrizes() }, [fetchPrizes])
  useEffect(() => { setBgGradient(BG_THEMES[getSavedBg(ROULETTE_BG_KEY)].gradient) }, [])
  useEffect(() => {
    soundEngine.bgStart()
    return () => soundEngine.bgPause()
  }, [])

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
      try {
        const ori = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }
        await ori.lock?.(screen.orientation.type)
      } catch {}
    } else {
      try { (screen.orientation as ScreenOrientation & { unlock?: () => void }).unlock?.() } catch {}
      document.exitFullscreen()
    }
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        background: bgGradient,
        fontFamily: "'Noto Sans KR', sans-serif",
      }}
    >
      <FireworksBackground />
      <SparklesOverlay />


<div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background: 'radial-gradient(70% 55% at 50% 42%, rgba(122,70,160,.35), transparent 70%)',
        }}
      />

      <div
        className="relative flex flex-col items-center justify-center min-h-screen px-5 py-4 roulette-center-mobile"
        style={{ zIndex: 2 }}
      >
        {loading ? (
          <div className="text-white text-xl animate-pulse">불러오는 중…</div>
        ) : prizes.length === 0 ? (
          <div style={{ color: '#f4c64a', fontSize: 18 }}>등록된 상품이 없습니다.</div>
        ) : (
          <div className="relative flex items-center justify-center w-full">
            {/* <SunRaysEffect /> */}
            <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
              <RouletteWheel prizes={prizes} onSpinComplete={fetchPrizes} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
