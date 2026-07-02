'use client'

import Image from 'next/image'
import { useEffect, useState, useCallback } from 'react'
import RouletteWheel from '@/components/RouletteWheel'
import FireworksBackground from '@/components/FireworksBackground'
import SparklesOverlay from '@/components/SparklesOverlay'
import SunRaysEffect from '@/components/SunRaysEffect'
import { Prize } from '@/types'
import { BG_THEMES, getSavedBg, ROULETTE_BG_KEY } from '@/lib/bg-themes'
import { soundEngine } from '@/lib/sounds'

export default function Home() {
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [loading, setLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [bgGradient, setBgGradient] = useState(BG_THEMES.indigo_black.gradient)

  const fetchPrizes = useCallback(async () => {
    try {
      const res = await fetch('/api/prizes')
      const data = await res.json()
      setPrizes(data)
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
        className="relative flex flex-col items-center justify-center min-h-screen px-5 py-8 logo-mobile-pt roulette-center-mobile"
        style={{ zIndex: 2 }}
      >
        <div
          className="logo-fixed-mobile cursor-pointer select-none mb-1"
          onClick={toggleFullscreen}
          title={isFullscreen ? '전체화면 해제' : '전체화면'}
        >
          <Image
            src="/logo.png"
            alt="월송CC점 GOLFZONPARK"
            width={260}
            height={80}
            style={{ objectFit: 'contain', width: '55%', height: 'auto', display: 'block', margin: '0 auto' }}
            priority
          />
        </div>

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
