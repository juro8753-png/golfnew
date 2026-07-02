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
  const [isPortrait, setIsPortrait] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const check = () => setIsPortrait(window.innerHeight > window.innerWidth)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

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

  const triggerSpin = () => {
    soundEngine.unlock()
    const btn = document.getElementById('roulette-spin-btn') as HTMLButtonElement | null
    if (btn && !btn.disabled) btn.click()
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#000', fontFamily: "'Noto Sans KR', sans-serif" }}>

      {/* 배경 이미지 — 방향에 따라 src 전환 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={isPortrait ? '/roulette-bg-portrait.png' : '/roulette-bg.png'}
        alt=""
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block',
          objectFit: isPortrait ? 'cover' : 'contain',
          objectPosition: 'center',
          transform: isPortrait ? 'none' : 'scaleX(1.15)',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* 폭죽 + 반짝이 */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
        <FireworksBackground />
        <SparklesOverlay />
      </div>

      {/* 룰렛 휠 (돌리기 버튼 숨김) */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        paddingBottom: isPortrait ? '28%' : '9%',
        marginTop: isPortrait ? 0 : -30,
      }}>
        {loading ? (
          <div style={{ color: 'white', fontSize: 20 }}>불러오는 중…</div>
        ) : prizes.length === 0 ? (
          <div style={{ color: '#f4c64a', fontSize: 18 }}>등록된 상품이 없습니다.</div>
        ) : (
          <div style={{ width: '100%' }}>
            <style>{`#roulette-spin-btn { display: none !important; }`}</style>
            <RouletteWheel prizes={prizes} onSpinComplete={fetchPrizes} onModalChange={setModalOpen} />
          </div>
        )}
      </div>

      {/* 이미지 버튼 위 투명 클릭 영역 */}
      {prizes.length > 0 && !modalOpen && (
        <button
          onClick={triggerSpin}
          style={{
            position: 'absolute',
            bottom: isPortrait ? '10%' : '13%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: isPortrait ? '80%' : '55%',
            height: isPortrait ? '13%' : '13%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            boxShadow: 'none',
            cursor: 'pointer',
            zIndex: 3,
            WebkitTapHighlightColor: 'transparent',
            appearance: 'none',
          }}
          aria-label="오늘의 행운 뽑기"
        />
      )}
    </div>
  )
}
