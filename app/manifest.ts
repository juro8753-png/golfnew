import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '스크린골프 이벤트 추첨',
    short_name: '이벤트 추첨',
    description: '스크린골프 이벤트 룰렛 추첨 시스템',
    start_url: '/',
    display: 'standalone',
    background_color: '#0d0719',
    theme_color: '#2a1342',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  }
}
