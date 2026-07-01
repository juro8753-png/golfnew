export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('spin_results')
    .select('spun_at')
    .order('spun_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = data as { spun_at: string }[]

  // 날짜별 카운트
  // KST(UTC+9) 기준 날짜 계산
  const toKSTDate = (iso: string) => {
    const d = new Date(iso)
    d.setUTCHours(d.getUTCHours() + 9)
    return d.toISOString().slice(0, 10)
  }

  const countMap: Record<string, number> = {}
  for (const row of rows) {
    const date = toKSTDate(row.spun_at)
    countMap[date] = (countMap[date] ?? 0) + 1
  }

  const now = new Date()
  now.setUTCHours(now.getUTCHours() + 9)
  const today = now.toISOString().slice(0, 10) // KST 오늘
  const today_count = countMap[today] ?? 0
  const total_count = rows.length

  // 최근 2개월(60일)만
  const daily_breakdown = Object.entries(countMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 60)

  return NextResponse.json({ today_count, total_count, daily_breakdown })
}
