'use client'

import { useEffect, useRef } from 'react'

const GOLD = ['#ffd700', '#f4c64a', '#ffd76a', '#ffb347', '#ffa500', '#ffe066']

interface Rocket {
  x: number; y: number
  tx: number; ty: number
  vy: number
  trail: Array<{ x: number; y: number }>
}

interface Spark {
  x: number; y: number
  px: number; py: number
  vx: number; vy: number
  life: number; age: number
  color: string; width: number
}

interface Star {
  x: number; y: number
  r: number; p: number; s: number
}

export default function FireworksBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rand = (a: number, b: number) => a + Math.random() * (b - a)

    const rockets: Rocket[] = []
    const sparks: Spark[] = []
    let stars: Star[] = []
    let frameId: number
    let t = 0

    const init = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const W = canvas.offsetWidth || window.innerWidth
      const H = canvas.offsetHeight || window.innerHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.scale(dpr, dpr)
      stars = Array.from({ length: 38 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H * 0.75,
        r: Math.random() * 1.3 + 0.3,
        p: Math.random() * Math.PI * 2,
        s: Math.random() * 0.04 + 0.01,
      }))
    }

    const launch = () => {
      const W = canvas.offsetWidth || window.innerWidth
      const H = canvas.offsetHeight || window.innerHeight
      rockets.push({
        x: rand(W * 0.15, W * 0.85),
        y: H + 10,
        tx: rand(W * 0.15, W * 0.85),
        ty: rand(-H * 0.05, H * 0.12),
        vy: -13,
        trail: [],
      })
    }

    const explode = (x: number, y: number) => {
      const n = Math.floor(rand(80, 120))
      const speed = 5.5
      const ring = Math.random() < 0.4
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n + rand(-0.04, 0.04)
        const sp = ring ? speed + rand(-0.3, 0.3) : speed * rand(0.3, 1)
        sparks.push({
          x, y, px: x, py: y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: rand(55, 100),
          age: 0,
          color: GOLD[Math.floor(Math.random() * GOLD.length)],
          width: rand(1.5, 3.0),
        })
      }
    }

    const tick = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) { frameId = requestAnimationFrame(tick); return }

      const W = canvas.offsetWidth || window.innerWidth
      const H = canvas.offsetHeight || window.innerHeight
      t++

      ctx.clearRect(0, 0, W, H)
      ctx.globalCompositeOperation = 'lighter'

      // 별 반짝임
      for (const s of stars) {
        s.p += s.s
        const tw = (Math.sin(s.p) + 1) / 2
        ctx.globalAlpha = 0.55 + tw * 0.45
        ctx.beginPath()
        ctx.fillStyle = '#ffd700'
        ctx.arc(s.x, s.y, s.r * (0.5 + tw * 0.8), 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      if (t % 14 === 0) launch()
      if (t % 28 === 0) launch()
      if (t % 45 === 0) { launch(); launch() }

      // 로켓 — 선 꼬리
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i]
        r.x += (r.tx - r.x) * 0.04
        r.y += r.vy
        r.vy += 0.08
        r.trail.push({ x: r.x, y: r.y })
        if (r.trail.length > 12) r.trail.shift()

        for (let j = 1; j < r.trail.length; j++) {
          const alpha = (j / r.trail.length) * 0.8
          ctx.beginPath()
          ctx.strokeStyle = `rgba(255,230,160,${alpha.toFixed(2)})`
          ctx.lineWidth = (j / r.trail.length) * 2.5
          ctx.lineCap = 'round'
          ctx.moveTo(r.trail[j - 1].x, r.trail[j - 1].y)
          ctx.lineTo(r.trail[j].x, r.trail[j].y)
          ctx.stroke()
        }

        ctx.beginPath()
        ctx.fillStyle = 'rgba(255,240,180,0.95)'
        ctx.arc(r.x, r.y, 2.2, 0, Math.PI * 2)
        ctx.fill()

        if (r.y <= r.ty || r.vy >= 0) {
          explode(r.x, r.y)
          rockets.splice(i, 1)
        }
      }

      // 스파크 — 선 + 머리 글로우
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i]
        p.px = p.x; p.py = p.y
        p.age++
        p.x += p.vx; p.y += p.vy
        p.vy += 0.055
        p.vx *= 0.94; p.vy *= 0.94
        const k = 1 - p.age / p.life
        if (k <= 0) { sparks.splice(i, 1); continue }

        ctx.beginPath()
        ctx.globalAlpha = Math.max(0, k * 0.9)
        ctx.strokeStyle = p.color
        ctx.lineWidth = p.width * k
        ctx.lineCap = 'round'
        ctx.moveTo(p.px, p.py)
        ctx.lineTo(p.x, p.y)
        ctx.stroke()

        ctx.beginPath()
        ctx.globalAlpha = Math.max(0, k)
        ctx.fillStyle = '#ffffff'
        ctx.arc(p.x, p.y, p.width * k * 0.8, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
      frameId = requestAnimationFrame(tick)
    }

    setTimeout(() => { init(); tick() }, 50)

    const onResize = () => init()
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
