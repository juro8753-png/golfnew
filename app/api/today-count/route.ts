export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const kstOffset = 9 * 60 * 60 * 1000
  const kstNow = new Date(Date.now() + kstOffset)
  const todayKST = kstNow.toISOString().slice(0, 10)

  // KST midnight → UTC: subtract 9 hours
  const startUTC = new Date(todayKST + 'T00:00:00.000Z')
  startUTC.setTime(startUTC.getTime() - kstOffset)
  const endUTC = new Date(startUTC.getTime() + 86400000)

  const { count, error } = await supabaseAdmin
    .from('spin_results')
    .select('*', { count: 'exact', head: true })
    .gte('spun_at', startUTC.toISOString())
    .lt('spun_at', endUTC.toISOString())

  if (error) return NextResponse.json({ count: 0, date: todayKST })
  return NextResponse.json({ count: count ?? 0, date: todayKST })
}
