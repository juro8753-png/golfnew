'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const navItems = [
  { href: '/admin', label: '대시보드' },
  { href: '/admin/results', label: '당첨 내역' },
  { href: '/roulette', label: '룰렛판으로' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const logout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.replace('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 네비게이션 */}
      <nav className="bg-gray-900 text-white px-3 py-2.5 flex items-center gap-1.5">
        <span className="font-bold text-green-400 text-base mr-2 shrink-0">⛳ 관리자</span>
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1 min-w-0">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                pathname === item.href
                  ? 'bg-green-600 text-white'
                  : 'hover:bg-gray-700 text-gray-300'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <button
          onClick={logout}
          className="shrink-0 ml-1 text-xs text-gray-400 hover:text-white transition-colors whitespace-nowrap"
        >
          로그아웃
        </button>
      </nav>

      {/* 콘텐츠 */}
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8">{children}</div>
    </div>
  )
}
