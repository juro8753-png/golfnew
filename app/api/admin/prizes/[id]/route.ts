export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/mock-db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const body = await req.json()

  const updated = await db.prizes.update(id, {
    name: body.name,
    total_quantity: Number(body.total_quantity),
    remaining_quantity: Number(body.remaining_quantity),
    is_unlimited: !!body.is_unlimited,
    is_consolation: !!body.is_consolation,
    color: body.color,
    display_order: Number(body.display_order ?? 0),
    probability: Number(body.probability ?? 0),
  })

  if (!updated) return NextResponse.json({ error: '상품을 찾을 수 없습니다.' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const ok = await db.prizes.delete(id)
  if (!ok) return NextResponse.json({ error: '상품을 찾을 수 없습니다.' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
