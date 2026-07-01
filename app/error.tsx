'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{ padding: 40, color: 'white', textAlign: 'center' }}>
      <h2>오류가 발생했습니다.</h2>
      <button onClick={reset} style={{ marginTop: 16, padding: '8px 20px', cursor: 'pointer' }}>
        다시 시도
      </button>
    </div>
  )
}
