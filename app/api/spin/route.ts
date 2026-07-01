export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { db } from '@/lib/mock-db'
import { pickWinner } from '@/lib/lottery'

export async function POST() {
  const prizes = await db.prizes.getAll()

  let winnerData: ReturnType<typeof pickWinner>
  try {
    winnerData = pickWinner(prizes)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }

  const { prize, segmentIndex } = winnerData

  const result = await db.results.create({
    prize_id: prize.id,
    prize_name: prize.name,
    is_winner: !prize.is_consolation,
  })

  if (!prize.is_unlimited && prize.remaining_quantity > 0) {
    await db.prizes.update(prize.id, { remaining_quantity: prize.remaining_quantity - 1 })
  }

  return NextResponse.json({ result, prize, segmentIndex })
}
