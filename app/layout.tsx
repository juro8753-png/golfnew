import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '스크린골프 이벤트',
  description: '이벤트 추첨 시스템',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '이벤트 추첨',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta name="theme-color" content="#2a1342" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Noto+Sans+KR:wght@400;500;700;900&family=Noto+Serif+KR:wght@700;900&family=Song+Myung&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
