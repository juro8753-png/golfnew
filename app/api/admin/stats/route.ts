export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { db } from '@/lib/mock-db'

export async function GET() {
  const [prizes, allResults, wonMap] = await Promise.all([
    db.prizes.getAll(),
    db.results.getAll(),
    db.results.countByPrize(),
  ])

  const total_spins = allResults.length
  const total_winners = allResults.filter(r => r.is_winner).length

  const prize_stats = prizes.map(p => ({
    ...p,
    won_count: wonMap[p.id] ?? 0,
  }))

  return NextResponse.json({ total_spins, total_winners, prize_stats })
}
