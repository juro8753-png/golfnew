// [left%, top%, size(px)]
const GLINTS: [number, number, number][] = [
  [8,   10, 22], [28,  7,  18], [72,  8,  24], [90, 14, 18],
  [6,   28, 16], [48, 18,  14], [85, 30,  20], [15, 48, 16],
  [92, 50,  14], [35, 62,  13], [70, 65,  18], [10, 78, 14],
  [88, 76,  16], [50, 84,  13], [25, 38,  13], [65, 38, 14],
  [55, 55,  12], [78, 20,  13],
]

const CLIP = 'polygon(50% 0,56% 44%,100% 50%,56% 56%,50% 100%,44% 56%,0 50%,44% 44%)'
const BG   = 'radial-gradient(circle,#ffffff 0%,#ffd700 40%,rgba(255,180,0,0) 72%)'

export default function SparklesOverlay() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3 }}>
      {GLINTS.map(([left, top, size], i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${left}%`,
            top: `${top}%`,
            width: size,
            height: size,
            marginLeft: -size / 2,
            marginTop: -size / 2,
            background: BG,
            clipPath: CLIP,
            filter: 'drop-shadow(0 0 5px rgba(255,210,0,1))',
            animation: `tw ${(2.2 + i * 0.28).toFixed(1)}s ease-in-out ${(i * 0.38).toFixed(1)}s infinite`,
          }}
        />
      ))}
    </div>
  )
}
