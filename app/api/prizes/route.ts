import { NextResponse } from 'next/server'
import { db } from '@/lib/mock-db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const prizes = await db.prizes.getAll()
  return NextResponse.json(prizes.slice(0, 6), {
    headers: {
      'Cache-Control': 's-maxage=30, stale-while-revalidate=60',
    },
  })
}
