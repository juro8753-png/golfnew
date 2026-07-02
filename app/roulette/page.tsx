'use client'

import { useEffect, useState, useCallback } from 'react'
import RouletteWheel from '@/components/RouletteWheel'
import FireworksBackground from '@/components/FireworksBackground'
import SparklesOverlay from '@/components/SparklesOverlay'
import { Prize } from '@/types'
import { soundEngine } from '@/lib/sounds'

export default function Home() {
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('prizes_cache')
      if (cached) {
        setPrizes(JSON.parse(cached) as Prize[])
        setLoading(false)
      }
    } catch {}
    fetchPrizes()
  }, [fetchPrizes])

  useEffect(() => {
    soundEngine.bgStart()
    return () => soundEngine.bgPause()
  }, [])

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', fontFamily: "'Noto Sans KR', sans-serif" }}>

      {/* 배경 이미지 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/roulette-bg.png"
        alt=""
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
      />

      {/* 폭죽 + 반짝이 (이미지 위) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
        <FireworksBackground />
        <SparklesOverlay />
      </div>

      {/* 룰렛 휠 + 버튼 */}
      <div
        style={{
          position: 'absolute', inset: 0, zIndex: 2,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }}
      >
        {loading ? (
          <div style={{ color: 'white', fontSize: 20 }}>불러오는 중…</div>
        ) : prizes.length === 0 ? (
          <div style={{ color: '#f4c64a', fontSize: 18 }}>등록된 상품이 없습니다.</div>
        ) : (
          <RouletteWheel prizes={prizes} onSpinComplete={fetchPrizes} />
        )}
      </div>
    </div>
  )
}
