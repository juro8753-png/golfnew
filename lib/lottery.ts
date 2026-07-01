import { Prize } from '@/types'

export function pickWinner(prizes: Prize[]): { prize: Prize; segmentIndex: number } {
  // 재고 있는 상품만 추출
  const available = prizes.filter(p => p.is_unlimited || p.remaining_quantity > 0)

  if (available.length === 0) {
    throw new Error('추첨 가능한 상품이 없습니다.')
  }

  // 재고 있는 상품의 확률 합산 (소진된 상품 제외 → 비례 재분배 자동 적용)
  const totalProb = available.reduce((sum, p) => sum + p.probability, 0)

  if (totalProb <= 0) {
    throw new Error('상품이 다 떨어졌습니다.')
  }

  const rand = Math.random() * totalProb
  let cumulative = 0

  for (const prize of available) {
    cumulative += prize.probability
    if (rand < cumulative) {
      return {
        prize,
        segmentIndex: prizes.findIndex(p => p.id === prize.id),
      }
    }
  }

  const last = available[available.length - 1]
  return {
    prize: last,
    segmentIndex: prizes.findIndex(p => p.id === last.id),
  }
}
