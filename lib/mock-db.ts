import { supabaseAdmin } from '@/lib/supabase'
import { Prize, SpinResult } from '@/types'

export const db = {
  prizes: {
    async getAll(): Promise<Prize[]> {
      const { data, error } = await supabaseAdmin
        .from('prizes')
        .select('*')
        .order('display_order', { ascending: true })
      if (error) throw new Error(error.message)
      return data as Prize[]
    },

    async getById(id: number): Promise<Prize | undefined> {
      const { data, error } = await supabaseAdmin
        .from('prizes')
        .select('*')
        .eq('id', id)
        .single()
      if (error) return undefined
      return data as Prize
    },

    async create(input: Omit<Prize, 'id' | 'created_at' | 'updated_at'>): Promise<Prize> {
      const { data, error } = await supabaseAdmin
        .from('prizes')
        .insert(input)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data as Prize
    },

    async update(id: number, updates: Partial<Prize>): Promise<Prize | null> {
      const { data, error } = await supabaseAdmin
        .from('prizes')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) return null
      return data as Prize
    },

    async delete(id: number): Promise<boolean> {
      await supabaseAdmin.from('spin_results').update({ prize_id: null }).eq('prize_id', id)
      const { error } = await supabaseAdmin
        .from('prizes')
        .delete()
        .eq('id', id)
      return !error
    },
  },

  results: {
    async getAll(): Promise<SpinResult[]> {
      const { data, error } = await supabaseAdmin
        .from('spin_results')
        .select('*')
        .order('spun_at', { ascending: false })
      if (error) throw new Error(error.message)
      return data as SpinResult[]
    },

    async getPaged(page: number, limit: number) {
      const from = (page - 1) * limit
      const to = from + limit - 1
      const { data, count, error } = await supabaseAdmin
        .from('spin_results')
        .select('*', { count: 'exact' })
        .order('spun_at', { ascending: false })
        .range(from, to)
      if (error) throw new Error(error.message)
      return { data: data as SpinResult[], count: count ?? 0 }
    },

    async create(input: Omit<SpinResult, 'id' | 'spun_at'>): Promise<SpinResult> {
      const { data, error } = await supabaseAdmin
        .from('spin_results')
        .insert(input)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data as SpinResult
    },

    async countByPrize(): Promise<Record<number, number>> {
      const { data, error } = await supabaseAdmin
        .from('spin_results')
        .select('prize_id')
      if (error) return {}
      return (data as { prize_id: number }[]).reduce((acc, r) => {
        acc[r.prize_id] = (acc[r.prize_id] ?? 0) + 1
        return acc
      }, {} as Record<number, number>)
    },
  },
}
