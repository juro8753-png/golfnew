export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/mock-db'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = Number(searchParams.get('page') ?? 1)
  const limit = Number(searchParams.get('limit') ?? 50)
  const { data, count } = await db.results.getPaged(page, limit)
  return NextResponse.json({ data, count, page, limit })
}

export async function DELETE() {
  const { error } = await supabaseAdmin.from('spin_results').delete().neq('id', 0)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
