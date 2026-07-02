'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Prize, SpinResponse } from '@/types'
import { soundEngine } from '@/lib/sounds'
import { getSavedTheme, WHEEL_THEMES, THEME_STORAGE_KEY, type WheelThemeConfig } from '@/lib/wheel-themes'
import { getEffectiveLimit, LIMITS_STORAGE_KEY } from '@/lib/daily-limits'

function getKSTToday(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

interface Props {
  prizes: Prize[]
  onSpinComplete: () => void
}

interface ConfettiParticle {
  x: number; y: number
  vx: number; vy: number
  color: string; size: number
  rotation: number; rotationSpeed: number
  opacity: number
}

const SPIN_DURATION = 7000
const MIN_ROTATIONS = 8

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

export default function RouletteWheel({ prizes, onSpinComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null)
  const confettiAnimRef = useRef<number>()
  const rotationRef = useRef(0)
  const animFrameRef = useRef<number>()
  const lastTickSegRef = useRef(-1)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<SpinResponse | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [theme, setTheme] = useState<WheelThemeConfig>(WHEEL_THEMES.fortune_wheel_classic)
  const [todayCount, setTodayCount] = useState(0)
  const [limitToast, setLimitToast] = useState(false)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const hubLogoImgRef = useRef<HTMLImageElement | null>(null)
  const pointerImgRef = useRef<HTMLImageElement | null>(null)
  const router = useRouter()

  useEffect(() => {
    const img = new Image()
    img.src = '/hub-logo.png'
    img.onload = () => { hubLogoImgRef.current = img }
  }, [])

  useEffect(() => {
    const img = new Image()
    img.src = '/pointer.png'
    img.onload = () => { pointerImgRef.current = img }
  }, [])



  // 테마 변경 감지
  useEffect(() => {
    setTheme(WHEEL_THEMES[getSavedTheme()])
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY) setTheme(WHEEL_THEMES[getSavedTheme()])
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // 오늘 참여 횟수 조회
  useEffect(() => {
    fetch('/api/today-count')
      .then(r => r.json())
      .then(data => setTodayCount(data.count ?? 0))
      .catch(() => {})
  }, [])

  const drawWheel = useCallback(
    (rotation: number) => {
      const canvas = canvasRef.current
      if (!canvas || prizes.length === 0) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const size = canvas.clientWidth || canvas.width
      const cx = size / 2
      const cy = size / 2
      const radius = cx - 28
      const n = prizes.length
      const segAngle = (2 * Math.PI) / n
      const th = theme

      ctx.clearRect(0, 0, size, size)

      // ─── fortune_wheel_classic: 100% faithful handoff recreation ───
      if (th.key === 'fortune_wheel_classic') {
        // s maps viewBox (Rseg=360, rim=450) → canvas pixels
        const s = (radius + 14) / 450

        const goldGrad = (x0: number, y0: number, x1: number, y1: number) => {
          const g = ctx.createLinearGradient(x0, y0, x1, y1)
          g.addColorStop(0,    '#fbeaa6')
          g.addColorStop(0.25, '#c89a36')
          g.addColorStop(0.5,  '#f7e08e')
          g.addColorStop(0.72, '#a87a26')
          g.addColorStop(1,    '#f3d97f')
          return g
        }

        // 1. Outer gold disc (r=450*s)
        ctx.beginPath()
        ctx.arc(cx, cy, 450 * s, 0, Math.PI * 2)
        ctx.fillStyle = goldGrad(cx - 450 * s, cy - 450 * s, cx + 450 * s, cy + 450 * s)
        ctx.fill()

        // 2. Dark rim (r=442*s) — PNG outside.png 색상 추출 적용
        ctx.beginPath()
        ctx.arc(cx, cy, 442 * s, 0, Math.PI * 2)
        const rimR = ctx.createRadialGradient(cx, cy - 20 * s, 0, cx, cy - 20 * s, 450 * s)
        rimR.addColorStop(0.60, '#1a140a')
        rimR.addColorStop(0.78, '#0d0a05')
        rimR.addColorStop(0.90, '#2a1f0e')
        rimR.addColorStop(1,    '#0a0704')
        ctx.fillStyle = rimR
        ctx.fill()

        // ── rotation group ──
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(rotation)

        // 3. Segments (alternating red/cream radial gradients)
        const rGrad = ctx.createRadialGradient(0, -25 * s, 0, 0, -25 * s, 380 * s)
        rGrad.addColorStop(0,    '#ef564d')
        rGrad.addColorStop(0.62, '#df3a34')
        rGrad.addColorStop(1,    '#c4271f')
        const cGrad = ctx.createRadialGradient(0, -25 * s, 0, 0, -25 * s, 380 * s)
        cGrad.addColorStop(0,    '#fbf4e0')
        cGrad.addColorStop(0.62, '#f3e7ca')
        cGrad.addColorStop(1,    '#e4d1a6')

        prizes.forEach((_, i) => {
          const start = -Math.PI / 2 - segAngle / 2 + i * segAngle
          const end   = start + segAngle
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.arc(0, 0, 390 * s, start, end)
          ctx.closePath()
          // 세그먼트 0: 이미지 배경색으로 덮어칠하기
          if (i === 0) {
            const pg = ctx.createLinearGradient(0, 0, 0, -390 * s)
            pg.addColorStop(0,    '#1a0120')
            pg.addColorStop(0.3,  '#2a002e')
            pg.addColorStop(0.6,  '#400a3c')
            pg.addColorStop(0.8,  '#4b0a42')
            pg.addColorStop(1,    '#4b0a42')
            ctx.fillStyle = pg
          } else if (i === 1) {
            const pg = ctx.createLinearGradient(0, 0, 338 * s, -195 * s)
            pg.addColorStop(0,    '#a36c12')
            pg.addColorStop(0.35, '#cc9129')
            pg.addColorStop(0.65, '#e2a935')
            pg.addColorStop(1,    '#f0be4f')
            ctx.fillStyle = pg
          } else if (i === 3) {
            const pg = ctx.createLinearGradient(0, 0, 0, 390 * s)
            pg.addColorStop(0,    '#14052e')
            pg.addColorStop(0.35, '#180439')
            pg.addColorStop(0.65, '#200749')
            pg.addColorStop(1,    '#26084e')
            ctx.fillStyle = pg
          } else if (i === 2) {
            const mid2 = -Math.PI / 2 + segAngle * 2.5 - segAngle / 2
            const ex = Math.cos(mid2) * 390 * s
            const ey = Math.sin(mid2) * 390 * s
            const pg = ctx.createLinearGradient(0, 0, ex, ey)
            pg.addColorStop(0,    '#012350')
            pg.addColorStop(0.4,  '#03265e')
            pg.addColorStop(0.75, '#032c6a')
            pg.addColorStop(1,    '#032c6a')
            ctx.fillStyle = pg
          } else if (i === 4) {
            const pg = ctx.createLinearGradient(0, 0, -338 * s, 195 * s)
            pg.addColorStop(0,    '#d6b17a')
            pg.addColorStop(0.35, '#d9b47d')
            pg.addColorStop(0.65, '#e4c38d')
            pg.addColorStop(1,    '#ebcc9d')
            ctx.fillStyle = pg
          } else if (i === 5) {
            // 7시(120°) 방향이 어둡고 반대(1시) 방향이 밝게
            const pg = ctx.createLinearGradient(-150 * s, 260 * s, 150 * s, -260 * s)
            pg.addColorStop(0,    '#004562')
            pg.addColorStop(0.35, '#005d81')
            pg.addColorStop(0.65, '#0182a9')
            pg.addColorStop(1,    '#0292b5')
            ctx.fillStyle = pg
          } else {
            ctx.fillStyle = i % 2 === 0 ? rGrad : cGrad
          }
          ctx.fill()

          // 파스텔 오버레이
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.arc(0, 0, 390 * s, start, end)
          ctx.closePath()
          ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
          ctx.fill()
        })

        // 4. Golden rod divider spokes (drawn programmatically)
        prizes.forEach((_, i) => {
          const ea      = -Math.PI / 2 - segAngle / 2 + i * segAngle
          const outerR  = 390 * s
          const halfLen = outerR / 2
          const sR = 4.5 * s   // shaft radius
          const bR = 10  * s   // ball radius
          const cR = 6.5 * s   // collar radius
          const cH = 8   * s   // collar height

          ctx.save()
          ctx.translate(Math.cos(ea) * halfLen, Math.sin(ea) * halfLen)
          ctx.rotate(ea - Math.PI / 2)

          // Local Y after rotation: +Y = outward (rim), -Y = inward (center/hub)
          // innerEnd = -halfLen (center, hidden by hub)
          // outer tip = +halfLen (rim)
          const innerEnd    = -halfLen
          const ballCY      = halfLen - bR           // ball center just inside rim
          const collarOuter = halfLen - bR * 2       // collar outer edge (below ball)
          const collarInner = collarOuter - cH       // collar inner edge

          // Cylindrical shading gradient (horizontal = perpendicular to rod)
          const cylG = (w: number) => {
            const g = ctx.createLinearGradient(-w, 0, w, 0)
            g.addColorStop(0,    '#ffffff')
            g.addColorStop(0.07, '#fef4c0')
            g.addColorStop(0.18, '#fce878')
            g.addColorStop(0.35, '#f0c840')
            g.addColorStop(0.50, '#d4a830')
            g.addColorStop(0.65, '#e8c040')
            g.addColorStop(0.82, '#fce878')
            g.addColorStop(0.93, '#fef4c0')
            g.addColorStop(1,    '#ffffff')
            return g
          }

          // ── Shaft (center → collar) ──
          ctx.shadowColor = 'rgba(0,0,0,0.28)'
          ctx.shadowBlur = 4 * s
          ctx.fillStyle = cylG(sR)
          ctx.fillRect(-sR, innerEnd, sR * 2, collarInner - innerEnd)

          // ── Collar ──
          ctx.fillStyle = cylG(cR)
          ctx.fillRect(-cR, collarInner, cR * 2, cH)
          ctx.shadowBlur = 0

          // Collar inner edge highlight
          ctx.fillStyle = 'rgba(255,248,160,0.55)'
          ctx.fillRect(-cR, collarInner, cR * 2, 1.5 * s)
          // Collar outer edge shadow
          ctx.fillStyle = 'rgba(0,0,0,0.28)'
          ctx.fillRect(-cR, collarOuter - 1.5 * s, cR * 2, 1.5 * s)

          // Rivet dots × 3
          const dotY  = collarInner + cH * 0.5
          const dotXs = [-cR * 0.5, 0, cR * 0.5]
          dotXs.forEach(dx => {
            const dg = ctx.createRadialGradient(dx - 0.4 * s, dotY - 0.4 * s, 0, dx, dotY, 1.4 * s)
            dg.addColorStop(0, '#fffce0')
            dg.addColorStop(1, '#5a3e00')
            ctx.beginPath()
            ctx.arc(dx, dotY, 1.4 * s, 0, Math.PI * 2)
            ctx.fillStyle = dg
            ctx.fill()
          })

          // ── Outer ball ──
          ctx.shadowColor = 'rgba(0,0,0,0.32)'
          ctx.shadowBlur = 6 * s
          const ballG = ctx.createRadialGradient(-bR * 0.3, ballCY - bR * 0.3, bR * 0.04, 0, ballCY, bR)
          ballG.addColorStop(0,    '#ffffff')
          ballG.addColorStop(0.12, '#fef6c0')
          ballG.addColorStop(0.30, '#fce060')
          ballG.addColorStop(0.55, '#e0a820')
          ballG.addColorStop(0.78, '#b88010')
          ballG.addColorStop(1,    '#7a5200')
          ctx.beginPath()
          ctx.arc(0, ballCY, bR, 0, Math.PI * 2)
          ctx.fillStyle = ballG
          ctx.fill()
          ctx.shadowBlur = 0

          // Ball specular highlight
          const specG = ctx.createRadialGradient(-bR * 0.32, ballCY - bR * 0.42, 0, -bR * 0.1, ballCY - bR * 0.15, bR * 0.7)
          specG.addColorStop(0,    'rgba(255,255,255,0.95)')
          specG.addColorStop(0.25, 'rgba(255,255,255,0.55)')
          specG.addColorStop(0.6,  'rgba(255,255,255,0.12)')
          specG.addColorStop(1,    'rgba(255,255,255,0)')
          ctx.beginPath()
          ctx.arc(0, ballCY, bR, 0, Math.PI * 2)
          ctx.fillStyle = specG
          ctx.fill()

          ctx.restore()
        })

        // 5. Gold ring stroke at r=394*s, width=11*s
        ctx.beginPath()
        ctx.arc(0, 0, 394 * s, 0, Math.PI * 2)
        ctx.strokeStyle = goldGrad(-394 * s, -394 * s, 394 * s, 394 * s)
        ctx.lineWidth = 11 * s
        ctx.lineCap = 'butt'
        ctx.stroke()

        // 6. Labels: rank (등수 고정) + prize name
        const RANKS = ['1등', '2등', '3등', '4등', '5등', '행운상']
        // 3등(i=2),4등(i=3),5등(i=4): rank↔name 위치 swap / 행운상(i=5): rank 더 바깥 / 2등(i=1): 약간 좌상
        const rankRadii  = [275, 275, 210, 210, 210, 295]
        const nameRadii  = [210, 210, 275, 275, 275, 210]
        const rankDx     = [  0,  -7,   0,   0,   0,   0]
        const rankDy     = [  0,  -7,   0,   0,   0,   0]
        prizes.forEach((prize, i) => {
          const midAngle = -Math.PI / 2 - segAngle / 2 + i * segAngle + segAngle / 2
          const rankLabel = RANKS[i] ?? prize.name

          const rankR = rankRadii[i] * s
          const rx = Math.cos(midAngle) * rankR + rankDx[i]
          const ry = Math.sin(midAngle) * rankR + rankDy[i]

          const nameR = nameRadii[i] * s
          const nx = Math.cos(midAngle) * nameR
          const ny = Math.sin(midAngle) * nameR

          ctx.save()
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'

          // ── Rank label (숫자 더 크게) ──
          const numFontSize = 28
          const sfxFontSize = 18

          const mkGxy = (y0: number, y1: number, t: string, m: string, b: string) => {
            const g = ctx.createLinearGradient(rx, y0, rx, y1)
            g.addColorStop(0, t); g.addColorStop(0.5, m); g.addColorStop(1, b)
            return g
          }
          const rankGradParams = [
            ['#fff6a0', '#f0be4f', '#c89a28'],
            ['#3a1200', '#6b2e00', '#3a1200'],
            ['#fff6a0', '#f0be4f', '#c89a28'],
            ['#fff6a0', '#f0be4f', '#c89a28'],
            ['#3a1200', '#6b2e00', '#3a1200'],
            ['#ffffff', '#d0f4ff', '#a0e8ff'],
          ]
          const [gc0, gc1, gc2] = rankGradParams[i] ?? ['#ffffff', '#eeeeee', '#ffffff']
          ctx.shadowColor = (i === 1 || i === 4) ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.65)'
          ctx.shadowBlur = 6
          ctx.shadowOffsetY = 2
          ctx.textBaseline = 'middle'

          const numMatch = rankLabel.match(/^(\d+)(.+)$/)
          if (numMatch) {
            const numPart = numMatch[1]
            const sfxPart = numMatch[2]
            ctx.font = `900 ${numFontSize}px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`
            const numW = ctx.measureText(numPart).width
            ctx.font = `900 ${sfxFontSize}px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`
            const sfxW = ctx.measureText(sfxPart).width
            const startX = rx - (numW + sfxW) / 2
            ctx.textAlign = 'left'

            ctx.font = `900 ${numFontSize}px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`
            ctx.fillStyle = mkGxy(ry - numFontSize * 0.6, ry + numFontSize * 0.6, gc0, gc1, gc2)
            ctx.fillText(numPart, startX, ry)

            ctx.font = `900 ${sfxFontSize}px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`
            ctx.fillStyle = mkGxy(ry - sfxFontSize * 0.6, ry + sfxFontSize * 0.6, gc0, gc1, gc2)
            ctx.fillText(sfxPart, startX + numW, ry + (numFontSize - sfxFontSize) / 2)
          } else {
            // 행운상 등 숫자 없는 경우
            ctx.font = `900 ${sfxFontSize}px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`
            ctx.fillStyle = mkGxy(ry - sfxFontSize * 0.6, ry + sfxFontSize * 0.6, gc0, gc1, gc2)
            ctx.textAlign = 'center'
            ctx.fillText(rankLabel, rx, ry)
          }

          // ── Prize name ──
          ctx.shadowBlur = 0
          ctx.shadowOffsetY = 0
          const nameFontSize = 11
          ctx.font = `bold ${nameFontSize}px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`
          const nameColors = ['#f0d8ff', '#3a1200', '#c8e4ff', '#d8ccff', '#3a1200', '#c0f0ff']
          ctx.fillStyle = nameColors[i] ?? '#ffffff'

          const words = prize.name.split(' ')
          if (words.length > 1 && ctx.measureText(prize.name).width > 50 * s) {
            const mid = Math.ceil(words.length / 2)
            ctx.fillText(words.slice(0, mid).join(' '), nx, ny - nameFontSize * 0.7)
            ctx.fillText(words.slice(mid).join(' '), nx, ny + nameFontSize * 0.7)
          } else {
            ctx.fillText(prize.name, nx, ny)
          }

          ctx.restore()
        })

        // 7. Bulbs at r=405*s (24, alternating blink)
        const bulbPhase = Math.floor(Date.now() / 300)
        for (let i = 0; i < 24; i++) {
          const ba = -Math.PI / 2 + (i / 24) * Math.PI * 2
          const bx = Math.cos(ba) * 421 * s
          const by = Math.sin(ba) * 421 * s
          const isLit = (i + bulbPhase) % 2 === 0
          const br = (isLit ? 13 : 12) * s
          ctx.beginPath()
          ctx.arc(bx, by, br, 0, Math.PI * 2)
          const bg = ctx.createRadialGradient(bx, by, 0, bx, by, br)
          if (isLit) {
            bg.addColorStop(0,    '#ffffff')
            bg.addColorStop(0.35, '#fffbe8')
            bg.addColorStop(0.70, '#ffe8a0')
            bg.addColorStop(1,    '#ffcc44')
          } else {
            bg.addColorStop(0,    '#c8a050')
            bg.addColorStop(0.50, '#7a5a20')
            bg.addColorStop(1,    '#3a2a0a')
          }
          ctx.fillStyle = bg
          ctx.fill()
          ctx.strokeStyle = '#7d4f17'
          ctx.lineWidth = 1.5
          ctx.stroke()
        }

        // 8. Hub (4-layer gold, scaled to r=75*s)
        {
          const HR  = 75 * s
          const bvR = HR * (136 / 150)
          const spR = HR * (113 / 150)
          const knR = HR * (110 / 150)
          const dtR = Math.max(1.5, HR * (9 / 150))
          const ang = 160 * Math.PI / 180

          ctx.save()
          ctx.beginPath()
          ctx.arc(0, 0, HR, 0, Math.PI * 2)
          ctx.shadowColor = 'rgba(0,0,0,0.45)'
          ctx.shadowBlur = 14
          ctx.shadowOffsetY = 5
          const hOg = ctx.createRadialGradient(0, 0, HR * 0.3, 0, 0, HR)
          hOg.addColorStop(0, '#fff5c0')
          hOg.addColorStop(1, '#d4a840')
          ctx.fillStyle = hOg
          ctx.fill()
          ctx.shadowBlur = 0; ctx.shadowOffsetY = 0
          ctx.restore()

          ctx.save()
          ctx.beginPath()
          ctx.arc(0, 0, bvR, 0, Math.PI * 2)
          const hBg = ctx.createRadialGradient(0, 0, bvR * 0.2, 0, 0, bvR)
          hBg.addColorStop(0,    '#f5dc90')
          hBg.addColorStop(0.52, '#d4a040')
          hBg.addColorStop(1,    '#a87030')
          ctx.fillStyle = hBg
          ctx.fill()
          ctx.restore()

          ctx.save()
          ctx.beginPath()
          ctx.arc(0, 0, spR, 0, Math.PI * 2)
          ctx.fillStyle = '#b89030'
          ctx.fill()
          ctx.restore()

          ctx.save()
          ctx.beginPath()
          ctx.arc(0, 0, knR, 0, Math.PI * 2)
          ctx.clip()
          const hCg = (ctx as unknown as { createConicGradient(s: number, x: number, y: number): CanvasGradient }).createConicGradient(0, 0, 0)
          hCg.addColorStop(0,        '#fff5c0')
          hCg.addColorStop(50 / 360, '#e8bf58')
          hCg.addColorStop(90 / 360, '#d0a848')
          hCg.addColorStop(130 / 360,'#e8bf58')
          hCg.addColorStop(180 / 360,'#fff5c0')
          hCg.addColorStop(230 / 360,'#e8bf58')
          hCg.addColorStop(270 / 360,'#d0a848')
          hCg.addColorStop(310 / 360,'#e8bf58')
          hCg.addColorStop(1,        '#fff5c0')
          ctx.fillStyle = hCg
          ctx.fillRect(-knR, -knR, knR * 2, knR * 2)
          // radial-gradient(circle at 40% 33%) — dome highlight
          const hDm = ctx.createRadialGradient(-knR * 0.2, -knR * 0.34, 0, 0, 0, knR)
          hDm.addColorStop(0,    'rgba(255,255,255,0.60)')
          hDm.addColorStop(0.52, 'rgba(255,255,255,0)')
          ctx.fillStyle = hDm
          ctx.fillRect(-knR, -knR, knR * 2, knR * 2)
          // box-shadow: inset 0 0 14px — inner shadow
          const hIn = ctx.createRadialGradient(0, 0, knR * 0.6, 0, 0, knR)
          hIn.addColorStop(0, 'rgba(90,60,12,0)')
          hIn.addColorStop(1, 'rgba(90,60,12,0.18)')
          ctx.fillStyle = hIn
          ctx.fillRect(-knR, -knR, knR * 2, knR * 2)
          ctx.restore()

        }

        ctx.restore()  // end rotation

        // 허브 로고 오버레이 (회전 없이 중앙 고정)
        if (hubLogoImgRef.current) {
          const logoSize = 75 * s * 3
          ctx.drawImage(hubLogoImgRef.current, cx - logoSize / 2, cy - logoSize / 2, logoSize, logoSize)
        }

        // 포인터 오버레이 (상단 정중앙 고정)
        if (pointerImgRef.current) {
          const pw = 56 * s
          const ph = 86 * s
          ctx.drawImage(pointerImgRef.current, cx - pw / 2, cy - 445 * s, pw, ph)
        }

        return
      }

      // 외부 원형 테두리
      ctx.beginPath()
      ctx.arc(cx, cy, radius + 14, 0, 2 * Math.PI)
      ctx.fillStyle = th.rimFill
      ctx.fill()

      // 림 링
      if (th.rimRingColor !== 'none') {
        if (th.neonGlow) {
          // 네온 멀티 레이어 글로우 링
          ctx.beginPath()
          ctx.arc(cx, cy, radius + 14, 0, 2 * Math.PI)
          ctx.shadowColor = th.rimRingColor
          ctx.shadowBlur = 50
          ctx.strokeStyle = th.rimRingColor
          ctx.lineWidth = 6
          ctx.stroke()

          ctx.beginPath()
          ctx.arc(cx, cy, radius + 14, 0, 2 * Math.PI)
          ctx.shadowColor = '#ff80ff'
          ctx.shadowBlur = 20
          ctx.strokeStyle = '#cc60ff'
          ctx.lineWidth = 3
          ctx.stroke()

          ctx.beginPath()
          ctx.arc(cx, cy, radius + 14, 0, 2 * Math.PI)
          ctx.shadowColor = '#ffffff'
          ctx.shadowBlur = 8
          ctx.strokeStyle = 'rgba(255,255,255,0.85)'
          ctx.lineWidth = 1.2
          ctx.stroke()

          ctx.shadowBlur = 0
        } else {
          ctx.beginPath()
          ctx.arc(cx, cy, radius + 14, 0, 2 * Math.PI)
          ctx.strokeStyle = th.rimRingColor
          ctx.lineWidth = 5
          ctx.stroke()
        }
      }

      // 세그먼트
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(rotation)

      prizes.forEach((prize, i) => {
        const startAngle = -Math.PI / 2 - segAngle / 2 + i * segAngle
        const endAngle = startAngle + segAngle

        const segFill = th.useCustomSegColors
          ? prize.color
          : i % 2 === 0 ? th.segEvenFill : th.segOddFill
        const segText = th.useCustomSegColors
          ? '#ffffff'
          : i % 2 === 0 ? th.segEvenText : th.segOddText

        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.arc(0, 0, radius, startAngle, endAngle)
        ctx.closePath()
        if (th.segGradient) {
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius)
          if (i % 2 === 0) {
            grad.addColorStop(0,    th.segEvenFillBright ?? '#FFFFFF')
            grad.addColorStop(0.96, th.segEvenFillBright ?? '#FFFFFF')
            grad.addColorStop(0.98, th.segEvenFill)
            grad.addColorStop(1,    th.segEvenFillDark   ?? th.segEvenFill)
          } else {
            grad.addColorStop(0,    th.segOddFillBright  ?? '#FFFFFF')
            grad.addColorStop(0.96, th.segOddFillBright  ?? '#FFFFFF')
            grad.addColorStop(0.98, th.segOddFill)
            grad.addColorStop(1,    th.segOddFillDark    ?? th.segOddFill)
          }
          ctx.fillStyle = grad
        } else {
          ctx.fillStyle = segFill
        }
        ctx.fill()
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.arc(0, 0, radius, startAngle, endAngle)
        ctx.closePath()
        ctx.strokeStyle = th.dividerColor
        ctx.lineWidth = th.dividerWidth
        ctx.stroke()

        ctx.save()
        ctx.rotate(startAngle + segAngle / 2)
        const fontSize = 10
        ctx.font = `bold ${fontSize}px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.shadowBlur = 0
        ctx.shadowColor = 'transparent'
        ctx.fillStyle = segText
        ctx.fillText(prize.name, radius * 0.6, 0)
        ctx.restore()
      })

      // 중심 허브 — 세그먼트와 함께 회전 (0,0 기준)
      {
        const HUB_R  = 22
        const bevelR = HUB_R * (136 / 150)
        const sepR   = HUB_R * (118 / 150)
        const knobR  = HUB_R * (110 / 150)
        const dotR   = Math.max(1.5, HUB_R * (9 / 150))
        const ang    = 160 * Math.PI / 180

        ctx.save()
        ctx.beginPath()
        ctx.arc(0, 0, HUB_R, 0, Math.PI * 2)
        ctx.shadowColor = 'rgba(0,0,0,0.45)'
        ctx.shadowBlur = 14
        ctx.shadowOffsetY = 5
        const hOg = ctx.createLinearGradient(
          -Math.cos(ang) * HUB_R, -Math.sin(ang) * HUB_R,
           Math.cos(ang) * HUB_R,  Math.sin(ang) * HUB_R
        )
        hOg.addColorStop(0, '#fdeea4')
        hOg.addColorStop(1, '#bb8a30')
        ctx.fillStyle = hOg
        ctx.fill()
        ctx.shadowBlur = 0; ctx.shadowOffsetY = 0
        ctx.restore()

        ctx.save()
        ctx.beginPath()
        ctx.arc(0, 0, bevelR, 0, Math.PI * 2)
        const hBg = ctx.createLinearGradient(0, -bevelR, 0, bevelR)
        hBg.addColorStop(0,    '#edc878')
        hBg.addColorStop(0.52, '#bd8530')
        hBg.addColorStop(1,    '#7d531a')
        ctx.fillStyle = hBg
        ctx.fill()
        ctx.restore()

        ctx.save()
        ctx.beginPath()
        ctx.arc(0, 0, sepR, 0, Math.PI * 2)
        ctx.fillStyle = '#9c7322'
        ctx.fill()
        ctx.restore()

        ctx.save()
        ctx.beginPath()
        ctx.arc(0, 0, knobR, 0, Math.PI * 2)
        ctx.clip()
        const hCg = (ctx as unknown as { createConicGradient(s: number, x: number, y: number): CanvasGradient }).createConicGradient(0, 0, 0)
        hCg.addColorStop(0,        '#f4e2a0')
        hCg.addColorStop(50 / 360, '#d3a948')
        hCg.addColorStop(90 / 360, '#b88c33')
        hCg.addColorStop(130 / 360,'#d3a948')
        hCg.addColorStop(180 / 360,'#f4e2a0')
        hCg.addColorStop(230 / 360,'#d3a948')
        hCg.addColorStop(270 / 360,'#b88c33')
        hCg.addColorStop(310 / 360,'#d3a948')
        hCg.addColorStop(1,        '#f4e2a0')
        ctx.fillStyle = hCg
        ctx.fillRect(-knobR, -knobR, knobR * 2, knobR * 2)
        ctx.lineWidth = 0.4
        for (let li = 0; li < 64; li++) {
          const la = (li / 64) * Math.PI * 2
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.lineTo(Math.cos(la) * knobR, Math.sin(la) * knobR)
          ctx.strokeStyle = li % 2 === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(60,40,8,0.10)'
          ctx.stroke()
        }
        const hDg = ctx.createRadialGradient(-knobR * 0.2, -knobR * 0.34, 0, 0, 0, knobR)
        hDg.addColorStop(0,    'rgba(255,255,255,0.60)')
        hDg.addColorStop(0.52, 'rgba(255,255,255,0)')
        ctx.fillStyle = hDg
        ctx.fillRect(-knobR, -knobR, knobR * 2, knobR * 2)
        const hIg = ctx.createRadialGradient(0, 0, knobR * 0.6, 0, 0, knobR)
        hIg.addColorStop(0, 'rgba(90,60,12,0)')
        hIg.addColorStop(1, 'rgba(90,60,12,0.35)')
        ctx.fillStyle = hIg
        ctx.fillRect(-knobR, -knobR, knobR * 2, knobR * 2)
        ctx.restore()

        ctx.beginPath()
        ctx.arc(0, 0, dotR, 0, Math.PI * 2)
        const hDdg = ctx.createRadialGradient(0, 0, 0, 0, 0, dotR)
        hDdg.addColorStop(0, '#caa23c')
        hDdg.addColorStop(1, '#8a6a1d')
        ctx.fillStyle = hDdg
        ctx.fill()

        if (th.neonGlow) {
          ctx.beginPath()
          ctx.arc(0, 0, HUB_R + 2, 0, 2 * Math.PI)
          ctx.shadowColor = th.hubInnerStroke
          ctx.shadowBlur = 25
          ctx.strokeStyle = th.hubInnerStroke
          ctx.lineWidth = 3
          ctx.stroke()
          ctx.shadowBlur = 0
        }
      }

      // 허브 시인
      {
        const HR    = 22
        const GHALF = HR * 2.5
        const CYCLE = 2.0
        const pos   = Math.cos((Date.now() / 1000) * Math.PI * 2 / CYCLE)
        const sx    = HR * 1.5 * pos
        const a     = 15 * Math.PI / 180
        ctx.save()
        ctx.beginPath()
        ctx.arc(0, 0, HR, 0, 2 * Math.PI)
        ctx.clip()
        const hSg = ctx.createLinearGradient(
          sx - Math.cos(a) * GHALF,  Math.sin(a) * GHALF,
          sx + Math.cos(a) * GHALF, -Math.sin(a) * GHALF
        )
        hSg.addColorStop(0,    'rgba(255,255,255,0)')
        hSg.addColorStop(0.38, 'rgba(255,255,255,0)')
        hSg.addColorStop(0.50, 'rgba(255,255,255,0.82)')
        hSg.addColorStop(0.62, 'rgba(255,255,255,0)')
        hSg.addColorStop(1,    'rgba(255,255,255,0)')
        ctx.fillStyle = hSg
        ctx.fillRect(-GHALF, -GHALF, GHALF * 2, GHALF * 2)
        ctx.restore()
      }

      // 허브 펄스 글로우
      {
        const HR  = 22
        const now = Date.now() / 1000
        const pulse = (Math.sin(now * Math.PI * 2 / 1.8) + 1) / 2

        ctx.save()
        const hPog = ctx.createRadialGradient(0, 0, HR * 0.85, 0, 0, HR + 10)
        hPog.addColorStop(0, `rgba(255,210,60,${(0.28 + pulse * 0.37).toFixed(3)})`)
        hPog.addColorStop(1, 'rgba(255,180,30,0)')
        ctx.fillStyle = hPog
        ctx.fillRect(-HR - 10, -HR - 10, (HR + 10) * 2, (HR + 10) * 2)
        ctx.restore()

        ctx.save()
        ctx.globalAlpha = 0.20 + pulse * 0.35
        ctx.beginPath()
        ctx.arc(0, 0, HR, 0, Math.PI * 2)
        ctx.clip()
        const hPig = ctx.createRadialGradient(0, 0, 0, 0, 0, HR)
        hPig.addColorStop(0,    'rgba(255,255,240,1)')
        hPig.addColorStop(0.55, 'rgba(255,230,140,0.7)')
        hPig.addColorStop(1,    'rgba(255,200,60,0)')
        ctx.fillStyle = hPig
        ctx.fillRect(-HR, -HR, HR * 2, HR * 2)
        ctx.restore()

      }

      ctx.restore()

      // 세그먼트 광원 오버레이 — 휠 중심 위쪽에서 빛이 비추는 효과
      {
        ctx.save()
        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx.clip()
        const lg = ctx.createRadialGradient(
          cx, cy - radius * 0.08, 0,
          cx, cy - radius * 0.08, radius * 1.1
        )
        lg.addColorStop(0,    'rgba(255,255,255,0.38)')
        lg.addColorStop(0.62, 'rgba(255,255,255,0.04)')
        lg.addColorStop(1,    'rgba(0,0,0,0.25)')
        ctx.fillStyle = lg
        ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)
        ctx.restore()
      }

      // 림 오로라/먹물 효과 — 모든 테마, 테마 고유색 사용
      {
        const hx = (hex: string) => ({
          r: parseInt(hex.slice(1, 3), 16),
          g: parseInt(hex.slice(3, 5), 16),
          b: parseInt(hex.slice(5, 7), 16),
        })
        const mc = hx(th.bulbOnColor)
        const rc = th.rimRingColor !== 'none' ? hx(th.rimRingColor) : mc
        const t = Date.now() / 1333
        ctx.save()
        ctx.beginPath()
        ctx.arc(cx, cy, radius + 14, 0, 2 * Math.PI)
        ctx.arc(cx, cy, radius, 0, 2 * Math.PI, true)
        ctx.clip('evenodd' as CanvasFillRule)
        const blobs = [
          { r: mc.r, g: mc.g, b: mc.b, speed:  1.0, sz: 30, op: 0.58 },
          { r: 140,  g:  40,  b: 255,  speed: -0.6, sz: 34, op: 0.40 },
          { r: mc.r, g: mc.g, b: mc.b, speed:  1.5, sz: 26, op: 0.48 },
          { r: rc.r, g: rc.g, b: rc.b, speed: -1.0, sz: 32, op: 0.34 },
          { r: mc.r, g: mc.g, b: mc.b, speed:  0.7, sz: 22, op: 0.52 },
          { r: 200,  g:   0,  b: 255,  speed: -1.3, sz: 28, op: 0.30 },
        ]
        blobs.forEach((bl, idx) => {
          const a = (idx / blobs.length) * Math.PI * 2 + t * bl.speed
          const gx = cx + (radius + 7) * Math.cos(a)
          const gy = cy + (radius + 7) * Math.sin(a)
          const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, bl.sz)
          grad.addColorStop(0, `rgba(${bl.r},${bl.g},${bl.b},${bl.op})`)
          grad.addColorStop(1, `rgba(${bl.r},${bl.g},${bl.b},0)`)
          ctx.fillStyle = grad
          ctx.fillRect(0, 0, size, size)
        })
        ctx.restore()
      }

      // LED 전구 (외부 링)
      const numBulbs = 32
      const bulbDist = radius + 7
      const phase = Math.floor(Date.now() / 180)
      for (let i = 0; i < numBulbs; i++) {
        const angle = -Math.PI / 2 + (i / numBulbs) * 2 * Math.PI
        const bx = cx + bulbDist * Math.cos(angle)
        const by = cy + bulbDist * Math.sin(angle)
        const isOn = (i + phase) % 2 === 0

        ctx.beginPath()
        ctx.arc(bx, by, 4.5, 0, 2 * Math.PI)
        if (isOn) {
          ctx.shadowColor = th.bulbGlowColor
          ctx.shadowBlur = th.neonGlow ? 28 : 16
          const grd = ctx.createRadialGradient(bx - 1, by - 1, 0, bx, by, 4.5)
          grd.addColorStop(0, '#FFFFFF')
          grd.addColorStop(0.4, th.bulbOnColor)
          grd.addColorStop(1, th.bulbOnColor)
          ctx.fillStyle = grd
        } else {
          ctx.shadowBlur = 0
          ctx.fillStyle = th.bulbOffColor
        }
        ctx.fill()
      }
      ctx.shadowBlur = 0

    },
    [prizes, theme]
  )

  // 캔버스 크기 설정 (resize 대응)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const applySize = () => {
      const dpr = window.devicePixelRatio || 1
      // 화면 너비 90%, 높이 75% 중 작은 값, 최대 700px
      const displaySize = Math.min(window.innerWidth * 0.90, window.innerHeight * 0.75, 700)
      canvas.width = displaySize * dpr
      canvas.height = displaySize * dpr
      canvas.style.width = `${displaySize}px`
      canvas.style.height = `${displaySize}px`
      const ctx = canvas.getContext('2d')
      ctx?.scale(dpr, dpr)
      drawWheel(rotationRef.current)
    }

    applySize()
    window.addEventListener('resize', applySize)
    return () => window.removeEventListener('resize', applySize)
  }, [prizes, drawWheel])

  // 비회전 상태에서 LED 깜빡임을 위한 idle 루프
  useEffect(() => {
    if (spinning) return
    let frameId: number
    const loop = () => {
      drawWheel(rotationRef.current)
      frameId = requestAnimationFrame(loop)
    }
    frameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameId)
  }, [spinning, drawWheel])

  // 컨페티 시작
  const startConfetti = useCallback(() => {
    const canvas = confettiCanvasRef.current
    if (!canvas) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const colors = ['#FF4444', '#44FF88', '#4488FF', '#FFEE00', '#FF44FF', '#44FFFF', '#FF8800', '#FF69B4', '#00FA9A', '#FFD700']
    const particles: ConfettiParticle[] = Array.from({ length: 200 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 6,
      vy: 3 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 7 + Math.random() * 9,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 14,
      opacity: 1,
    }))

    if (confettiAnimRef.current) cancelAnimationFrame(confettiAnimRef.current)

    const animate = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      let hasActive = false
      for (const p of particles) {
        if (p.opacity <= 0) continue
        hasActive = true
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.rotationSpeed
        p.vy += 0.08
        if (p.y > canvas.height * 0.75) p.opacity -= 0.022

        ctx.save()
        ctx.globalAlpha = Math.max(0, p.opacity)
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.55)
        ctx.restore()
      }

      if (hasActive) {
        confettiAnimRef.current = requestAnimationFrame(animate)
      } else {
        setShowConfetti(false)
      }
    }

    setShowConfetti(true)
    confettiAnimRef.current = requestAnimationFrame(animate)
  }, [])

  const spin = async () => {
    if (spinning || prizes.length === 0) return

    const limit = getEffectiveLimit(getKSTToday())
    if (limit !== null && todayCount >= limit) {
      setLimitToast(false)
      requestAnimationFrame(() => setLimitToast(true))
      clearTimeout(toastTimerRef.current)
      toastTimerRef.current = setTimeout(() => setLimitToast(false), 2500)
      return
    }

    setSpinning(true)
    setShowModal(false)

    const n = prizes.length
    const segAngle = (2 * Math.PI) / n

    // API 요청과 애니메이션을 동시에 시작
    const fetchPromise = fetch('/api/spin', { method: 'POST' })

    soundEngine.spinStart()

    const startRotation = rotationRef.current
    const startTime = performance.now()
    lastTickSegRef.current = -1

    // API 응답 후 채워질 상태 (클로저로 공유)
    let apiResult: SpinResponse | null = null
    let finalRotation = 0
    let decelStartTime = 0
    let decelStartRotation = 0

    // 가속 단계: RAMP_DURATION ms 동안 최고속도까지 가속
    const RAMP_DURATION = 700
    const TOP_SPEED = (MIN_ROTATIONS * 2 * Math.PI) / SPIN_DURATION // rad/ms

    const animate = (now: number) => {
      if (apiResult === null) {
        // 로딩 중: 부드럽게 가속 후 최고속도 유지
        const elapsed = now - startTime
        const rot = elapsed < RAMP_DURATION
          ? startRotation + 0.5 * TOP_SPEED * (elapsed * elapsed / RAMP_DURATION)
          : startRotation + 0.5 * TOP_SPEED * RAMP_DURATION + TOP_SPEED * (elapsed - RAMP_DURATION)

        rotationRef.current = rot

        const curSeg = Math.floor(((rot % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) / segAngle)
        if (curSeg !== lastTickSegRef.current) {
          soundEngine.tick(0.25)
          lastTickSegRef.current = curSeg
        }

        drawWheel(rot)
        animFrameRef.current = requestAnimationFrame(animate)
      } else {
        // API 응답 완료: 목표 세그먼트로 easeOut 감속
        const elapsed = now - decelStartTime
        const t = Math.min(elapsed / SPIN_DURATION, 1)
        const newRotation = decelStartRotation + (finalRotation - decelStartRotation) * easeOut(t)

        const curSeg = Math.floor(((newRotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) / segAngle)
        if (curSeg !== lastTickSegRef.current) {
          soundEngine.tick(1 - easeOut(t))
          lastTickSegRef.current = curSeg
        }

        rotationRef.current = newRotation
        drawWheel(newRotation)

        if (t < 1) {
          animFrameRef.current = requestAnimationFrame(animate)
        } else {
          rotationRef.current = finalRotation
          setSpinning(false)
          const response = apiResult
          setResult(response)
          setShowModal(true)

          const nonConsolation = prizes.filter(p => !p.is_consolation).sort((a, b) => a.display_order - b.display_order)
          const rank = nonConsolation.findIndex(p => p.id === response.prize.id)

          if (response.prize.is_consolation) {
            soundEngine.bgDuck(2500)
            soundEngine.consolation()
          } else if (rank === 0) {
            soundEngine.bgDuck(7000)
            soundEngine.winGrand()
            soundEngine.playTTS('/sounds/tts_1st.mp3', 800)
          } else if (rank === 1) {
            soundEngine.bgDuck(5000)
            soundEngine.win2nd()
            soundEngine.playTTS('/sounds/tts_2nd.mp3', 500)
          } else if (rank === 2) {
            soundEngine.bgDuck(4500)
            soundEngine.winNormal()
            soundEngine.playTTS('/sounds/tts_3rd.mp3', 500)
          } else {
            soundEngine.bgDuck(3500)
            soundEngine.winNormal()
          }
          if (!response.prize.is_consolation) startConfetti()
          setTodayCount(c => c + 1)
          onSpinComplete()
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(animate)

    // API 응답 처리 (애니메이션과 병렬)
    try {
      const res = await fetchPromise
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '서버 오류')
      }
      const spinResponse: SpinResponse = await res.json()

      // 현재 휠 위치에서 목표 세그먼트까지의 감속 계산
      const curRotation = rotationRef.current
      const curNorm = ((curRotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
      const targetBase = ((-spinResponse.segmentIndex * segAngle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
      let delta = (targetBase - curNorm + 2 * Math.PI) % (2 * Math.PI)
      if (delta < 0.2) delta += 2 * Math.PI

      decelStartTime = performance.now()
      decelStartRotation = curRotation
      finalRotation = curRotation + delta + 2 * Math.PI * MIN_ROTATIONS
      apiResult = spinResponse
    } catch (e) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      setSpinning(false)
      soundEngine.bgStop()
      alert((e as Error).message || '추첨 중 오류가 발생했습니다.')
    }
  }

  const isWin = result && !result.prize.is_consolation

  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full h-full">
      {/* 컨페티 캔버스 */}
      <canvas
        ref={confettiCanvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 200, display: showConfetti ? 'block' : 'none' }}
      />

      {/* 휠 + 포인터 */}
      <div className="relative flex items-center justify-center" style={{ marginTop: '36px' }}>
        {/* <div className="absolute pointer-events-none" style={{
          zIndex: 10, top: -22, left: '50%', transform: 'translateX(-50%)',
          animation: 'triGlow 1.8s ease-in-out infinite',
        }}>
          <div style={{
            position: 'absolute',
            top: -2,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '17px solid transparent',
            borderRight: '17px solid transparent',
            borderTop: '34px solid rgba(255,215,0,0.75)',
          }} />
          <div style={{
            position: 'relative',
            width: 0,
            height: 0,
            borderLeft: '13px solid transparent',
            borderRight: '13px solid transparent',
            borderTop: '28px solid #FFD700',
          }} />
        </div> */}
        <canvas
          ref={canvasRef}
          className="rounded-full"
          onDoubleClick={() => router.push('/admin')}
          style={{
            cursor: 'pointer',
            filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.55)) drop-shadow(0 0 28px rgba(255,255,255,0.22)) drop-shadow(0 0 55px rgba(255,255,255,0.09))',
          }}
        />
      </div>

      {/* 돌리기 버튼 */}
      <button
        onClick={spin}
        disabled={spinning}
        className="relative select-none overflow-hidden"
        style={{
          width: '100%', maxWidth: 300,
          border: spinning ? '2.5px solid #888' : '2.5px solid #f5c832',
          boxShadow: spinning ? 'none' : '0 0 0 1px #c07812, 0 0 14px 3px rgba(245,200,50,0.5)',
          cursor: spinning ? 'not-allowed' : 'pointer',
          borderRadius: 30,
          padding: '16px 20px',
          background: spinning
            ? 'linear-gradient(180deg,#888,#666 48%,#555)'
            : 'linear-gradient(180deg,#fbe08a,#f2bd3e 48%,#e29a1b)',
          color: spinning ? '#ccc' : '#3a230a',
          fontFamily: "'Noto Sans KR', sans-serif",
          fontWeight: 900,
          fontSize: 20,
          letterSpacing: '.5px',
          animation: spinning ? 'none' : 'btnGlow 2.2s ease-in-out infinite',
          transform: spinning ? 'scale(0.97)' : undefined,
          transition: 'transform .15s',
        }}
      >
        {!spinning && (
          <span style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(105deg,transparent 38%,rgba(255,255,255,.8) 50%,transparent 62%)',
            backgroundSize: '220% 100%',
            animation: 'sheen 3.2s ease-in-out infinite',
          }} />
        )}
        <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          {spinning ? '추첨 중…' : (
            <>
              돌리기!
              <span style={{
                display: 'inline-flex', width: 26, height: 26,
                borderRadius: '50%', background: '#3a230a',
                color: '#f2bd3e', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, lineHeight: 1, animation: 'arrowNudge 1.2s ease-in-out infinite',
              }}>
                <span style={{ position: 'relative', top: -1, left: 1, lineHeight: 1 }}>▸</span>
              </span>
            </>
          )}
        </span>
      </button>

      {/* 참여 횟수 소진 토스트 */}
      {limitToast && (
        <div
          className="limit-toast"
          style={{
            position: 'fixed',
            left: '50%',
            bottom: '180px',
            zIndex: 300,
            background: 'rgba(20,20,20,0.93)',
            color: 'white',
            padding: '16px 28px',
            borderRadius: '20px',
            fontSize: '17px',
            fontWeight: 800,
            letterSpacing: '.3px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          ⛔ 당일 참여 횟수가 소진되었습니다
        </div>
      )}

      {/* 결과 모달 */}
      {showModal && result && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-6"
          style={{ backdropFilter: 'blur(6px)' }}
          onClick={() => setShowModal(false)}
        >
          <div
            className={`modal-bounce-in bg-white rounded-3xl p-10 w-full max-w-xs text-center shadow-2xl ${isWin ? 'win-glow' : ''}`}
            onClick={e => e.stopPropagation()}
          >
            {result.prize.is_consolation ? (
              <>
                <div className="text-7xl mb-3 consolation-shake inline-block">😢</div>
                <p className="text-2xl text-gray-500 mb-1">아쉽네요</p>
                <p className="text-5xl font-black text-gray-400 mb-6">꽝!</p>
              </>
            ) : (
              <>
                <div className="text-7xl mb-3" style={{ filter: 'drop-shadow(0 0 14px gold)' }}>🎉</div>
                <p className="text-2xl text-green-600 font-bold mb-1">축하합니다!</p>
                <p
                  className="text-4xl font-black mb-1"
                  style={{ color: result.prize.color, textShadow: `0 0 18px ${result.prize.color}` }}
                >
                  {result.prize.name}
                </p>
                <p className="text-gray-500 mb-6">당첨되셨습니다!</p>
              </>
            )}
            <button
              onClick={() => router.push('/')}
              className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-white text-xl font-bold rounded-2xl transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
