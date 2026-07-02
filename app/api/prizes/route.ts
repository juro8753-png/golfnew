import { NextResponse } from 'next/server'
import { db } from '@/lib/mock-db'

export const revalidate = 30

export async function GET() {
  const prizes = await db.prizes.getAll()
  return NextResponse.json(prizes.slice(0, 6))
}
