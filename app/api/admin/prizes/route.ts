import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/mock-db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const prizes = await db.prizes.getAll()
  return NextResponse.json(prizes)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, total_quantity, is_unlimited, is_consolation, color, display_order, probability } = body

  if (!name || total_quantity == null) {
    return NextResponse.json({ error: '이름과 수량은 필수입니다.' }, { status: 400 })
  }

  const prize = await db.prizes.create({
    name,
    total_quantity: Number(total_quantity),
    remaining_quantity: Number(total_quantity),
    is_unlimited: !!is_unlimited,
    is_consolation: !!is_consolation,
    color: color || '#36A2EB',
    display_order: Number(display_order ?? 0),
    probability: Number(probability ?? 0),
  })

  return NextResponse.json(prize)
}

// 확률 일괄 저장: [{ id, probability }, ...]
export async function PATCH(req: NextRequest) {
  const updates: { id: number; probability: number }[] = await req.json()

  const total = updates.reduce((sum, u) => sum + u.probability, 0)
  if (Math.abs(total - 100) > 0.01) {
    return NextResponse.json({ error: `확률 합계가 ${total.toFixed(1)}%입니다. 100%가 되어야 합니다.` }, { status: 400 })
  }

  await Promise.all(updates.map(u => db.prizes.update(u.id, { probability: u.probability })))
  return NextResponse.json({ ok: true })
}
