'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body style={{ background: '#1a0d2e', color: 'white', textAlign: 'center', padding: 40 }}>
        <h2>오류가 발생했습니다.</h2>
        <button onClick={reset} style={{ marginTop: 16, padding: '8px 20px', cursor: 'pointer' }}>
          다시 시도
        </button>
      </body>
    </html>
  )
}
