'use client'

const SIZE = 800
const CX = SIZE / 2
const CY = SIZE / 2
const INNER_R = 242  // 휠 림 반경 (SVG 좌표 기준)

// 블룸 링 위치 — RouletteWheel의 marginTop:36px 때문에 휠 중심이 SVG 중심보다 위에 있음
const BLOOM_CX = CX
const BLOOM_CY = CY - 22   // 위로 올리기
const BLOOM_R  = 218        // 실제 휠 림에 맞게 축소

// 광원 위치: 휠 왼쪽 상단 (참고 이미지 기준)
const SX = 228
const SY = 182

interface Ray {
  a: number   // 각도 (rad)
  len: number // 길이 (px)
  bw: number  // 밑면 너비 (px)
  op: number  // 불투명도
  c0: string  // 광원쪽 색상
  c1: string  // 끝 색상
  glow?: boolean // 소프트 글로우 블러 적용
}

const RAYS: Ray[] = [
  // ── 긴 수평 가로 빔 (dominant streak, 좌→우) ──
  { a: 0.07,              len: 590, bw: 3.5, op: 0.90, c0: 'rgba(255,255,255,0.95)', c1: 'rgba(180,215,255,0)', glow: true },
  { a: Math.PI + 0.07,   len: 420, bw: 3.0, op: 0.78, c0: 'rgba(255,255,255,0.88)', c1: 'rgba(180,215,255,0)', glow: true },

  // ── 긴 대각선 빔 (오른쪽 아래) ──
  { a: 0.90,              len: 430, bw: 4.0, op: 0.68, c0: 'rgba(255,255,255,0.82)', c1: 'rgba(180,215,255,0)', glow: true },

  // ── 핑크/마젠타 보조 광선 (왼쪽 위 방향, 렌즈 색수차) ──
  { a: -2.15,             len: 265, bw: 3.5, op: 0.64, c0: 'rgba(255,135,220,0.80)', c1: 'rgba(255,70,190,0)',  glow: true },
  { a: -2.30,             len: 160, bw: 5.0, op: 0.45, c0: 'rgba(255,160,230,0.60)', c1: 'rgba(255,100,200,0)', glow: true },

  // ── 중간 길이 스포크 ──
  { a: -0.40,             len: 205, bw: 7,   op: 0.62, c0: 'rgba(255,255,255,0.78)', c1: 'rgba(200,225,255,0)' },
  { a: 1.70,              len: 228, bw: 6,   op: 0.58, c0: 'rgba(255,255,255,0.72)', c1: 'rgba(200,225,255,0)' },
  { a: 2.35,              len: 178, bw: 6,   op: 0.54, c0: 'rgba(255,255,255,0.68)', c1: 'rgba(200,225,255,0)' },
  { a: -1.10,             len: 158, bw: 6,   op: 0.50, c0: 'rgba(255,255,255,0.65)', c1: 'rgba(200,225,255,0)' },
  { a: Math.PI - 0.45,   len: 188, bw: 5,   op: 0.52, c0: 'rgba(255,255,255,0.68)', c1: 'rgba(200,225,255,0)' },

  // ── 짧은 스포크 (스타버스트 코어 채우기) ──
  { a:  0.45,  len: 95,  bw: 9,   op: 0.58, c0: 'rgba(255,255,255,0.82)', c1: 'rgba(220,235,255,0)' },
  { a: -0.18,  len: 82,  bw: 10,  op: 0.54, c0: 'rgba(255,255,255,0.78)', c1: 'rgba(220,235,255,0)' },
  { a:  1.25,  len: 100, bw: 8,   op: 0.50, c0: 'rgba(255,255,255,0.72)', c1: 'rgba(220,235,255,0)' },
  { a: -1.95,  len: 84,  bw: 8,   op: 0.46, c0: 'rgba(255,255,255,0.68)', c1: 'rgba(220,235,255,0)' },
  { a:  2.80,  len: 110, bw: 7,   op: 0.50, c0: 'rgba(255,255,255,0.68)', c1: 'rgba(220,235,255,0)' },
  { a: -1.58,  len: 74,  bw: 8,   op: 0.44, c0: 'rgba(255,255,255,0.65)', c1: 'rgba(220,235,255,0)' },
  { a:  3.05,  len: 90,  bw: 7,   op: 0.48, c0: 'rgba(255,255,255,0.68)', c1: 'rgba(220,235,255,0)' },
  { a: -2.60,  len: 70,  bw: 8,   op: 0.42, c0: 'rgba(255,255,255,0.65)', c1: 'rgba(220,235,255,0)' },
]

export default function SunRaysEffect() {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        width: 'min(160vw, 800px)',
        height: 'min(160vw, 800px)',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 0,
      }}
    >
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ width: '100%', height: '100%' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* 휠 뒤 앰비언트 글로우 */}
          <radialGradient id="ambientGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="rgba(140,100,225,0.44)"/>
            <stop offset="50%"  stopColor="rgba(90,55,165,0.18)"/>
            <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
          </radialGradient>

          {/* 스타버스트 코로나 */}
          <radialGradient id="starCorona" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.75)"/>
            <stop offset="40%"  stopColor="rgba(200,225,255,0.40)"/>
            <stop offset="100%" stopColor="rgba(150,200,255,0)"/>
          </radialGradient>

          {/* 블러 필터 */}
          <filter id="gblur"  x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="24"/>
          </filter>
          <filter id="mblur"  x="-80%"  y="-80%"  width="260%" height="260%">
            <feGaussianBlur stdDeviation="9"/>
          </filter>
          <filter id="sblur"  x="-60%"  y="-60%"  width="220%" height="220%">
            <feGaussianBlur stdDeviation="1.2"/>
          </filter>

          {/* 휠 외부 블룸 필터 3단계 */}
          <filter id="bloomW" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="32"/>
          </filter>
          <filter id="bloomM" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="14"/>
          </filter>
          <filter id="bloomT" x="-15%" y="-15%" width="130%" height="130%">
            <feGaussianBlur stdDeviation="5"/>
          </filter>

          {/* 광선별 선형 그라디언트 (광원→끝) */}
          {RAYS.map((r, i) => {
            const tx = SX + Math.cos(r.a) * r.len
            const ty = SY + Math.sin(r.a) * r.len
            return (
              <linearGradient
                key={i}
                id={`rg_${i}`}
                gradientUnits="userSpaceOnUse"
                x1={SX.toFixed(1)} y1={SY.toFixed(1)}
                x2={tx.toFixed(1)} y2={ty.toFixed(1)}
              >
                <stop offset="0%"   stopColor={r.c0}/>
                <stop offset="100%" stopColor={r.c1}/>
              </linearGradient>
            )
          })}
        </defs>



        {/* 2. 스타버스트 대형 코로나 (블러드 헤일로) */}
        <circle cx={SX} cy={SY} r={105} fill="url(#starCorona)" filter="url(#gblur)"/>

        {/* 3. 스타버스트 소형 헤일로 */}
        <circle cx={SX} cy={SY} r={32} fill="rgba(255,255,255,0.62)" filter="url(#mblur)"/>

        {/* 4. 광선 */}
        {RAYS.map((r, i) => {
          const perp = r.a + Math.PI / 2
          const bHalf = r.bw / 2
          const b1x = SX + Math.cos(perp) * bHalf
          const b1y = SY + Math.sin(perp) * bHalf
          const b2x = SX - Math.cos(perp) * bHalf
          const b2y = SY - Math.sin(perp) * bHalf
          const ax = SX + Math.cos(r.a) * r.len
          const ay = SY + Math.sin(r.a) * r.len
          return (
            <polygon
              key={i}
              points={`${b1x.toFixed(1)},${b1y.toFixed(1)} ${b2x.toFixed(1)},${b2y.toFixed(1)} ${ax.toFixed(1)},${ay.toFixed(1)}`}
              fill={`url(#rg_${i})`}
              opacity={r.op}
              filter={r.glow ? 'url(#sblur)' : undefined}
            />
          )
        })}

        {/* 5. 스타버스트 코어 (밝은 점) */}
        <circle cx={SX} cy={SY} r={9}   fill="rgba(255,255,255,0.96)"/>
        <circle cx={SX} cy={SY} r={4.5} fill="white"/>
      </svg>
    </div>
  )
}
