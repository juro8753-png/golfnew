'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { soundEngine } from '@/lib/sounds'

function playChime() {
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  if (!AudioCtx) return
  const ctx = new AudioCtx()
  const notes = [523, 659, 784, 1047]
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08)
    gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08)
    gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + i * 0.08 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.35)
    osc.start(ctx.currentTime + i * 0.08)
    osc.stop(ctx.currentTime + i * 0.08 + 0.4)
  })
}

export default function LandingPage() {
  const router = useRouter()

  useEffect(() => {
    router.prefetch('/roulette')
    fetch('/api/prizes').then(r => r.json()).then(data => {
      if (Array.isArray(data)) sessionStorage.setItem('prizes_cache', JSON.stringify(data))
    }).catch(() => {})
  }, [router])

  const handleClick = () => {
    playChime()
    soundEngine.bgStart()
    setTimeout(() => router.push('/roulette'), 100)
  }

  return (
    <div
      onClick={handleClick}
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        cursor: 'pointer',
        background: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/landing.jpg"
        alt="날마다 福 나눔 이벤트"
        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
      />
    </div>
  )
}

/*
  ── 기존 코드 보존 ──────────────────────────────────────────────

'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import ColorfulFireworksBackground from '@/components/ColorfulFireworksBackground'
import SparklesOverlay from '@/components/SparklesOverlay'
import { soundEngine } from '@/lib/sounds'
import { BG_THEMES, getSavedBg, LANDING_BG_KEY } from '@/lib/bg-themes'

export default function LandingPage() {
  const router = useRouter()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [bgGradient, setBgGradient] = useState(BG_THEMES.emerald_black.gradient)

  useEffect(() => {
    setBgGradient(BG_THEMES[getSavedBg(LANDING_BG_KEY)].gradient)
    router.prefetch('/roulette')
    fetch('/api/prizes').then(r => r.json()).then(data => {
      if (Array.isArray(data)) sessionStorage.setItem('prizes_cache', JSON.stringify(data))
    }).catch(() => {})
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  ...기존 JSX 생략...
}
*/
