export interface Prize {
  id: number
  name: string
  total_quantity: number
  remaining_quantity: number
  is_unlimited: boolean
  is_consolation: boolean
  color: string
  display_order: number
  probability: number
  created_at: string
  updated_at: string
}

export interface SpinResult {
  id: number
  prize_id: number
  prize_name: string
  is_winner: boolean
  spun_at: string
}

export interface SpinResponse {
  result: SpinResult
  prize: Prize
  segmentIndex: number
}

export interface PrizeStat {
  id: number
  name: string
  total_quantity: number
  remaining_quantity: number
  is_unlimited: boolean
  is_consolation: boolean
  color: string
  won_count: number
}

export interface AdminStats {
  total_spins: number
  total_winners: number
  prize_stats: PrizeStat[]
}
