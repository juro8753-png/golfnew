'use client'

import { useEffect, useState, useCallback } from 'react'
import { SpinResult } from '@/types'

const PAGE_SIZE = 50

export default function ResultsPage() {
  const [results, setResults] = useState<SpinResult[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchResults = useCallback(async (p: number) => {
    setLoading(true)
    const res = await fetch(`/api/admin/results?page=${p}&limit=${PAGE_SIZE}`)
    const data = await res.json()
    setResults(data.data ?? [])
    setTotal(data.count ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => { fetchResults(page) }, [page, fetchResults])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const handleReset = async () => {
    if (!confirm('당첨 내역을 전부 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) return
    await fetch('/api/admin/results', { method: 'DELETE' })
    setPage(1)
    fetchResults(1)
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    return { date, time }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">당첨 내역</h1>
          {total > 0 && (
            <button
              onClick={handleReset}
              className="text-sm text-red-500 hover:text-red-700 border border-red-300 hover:border-red-500 px-3 py-1.5 rounded-lg transition-colors"
            >
              리셋하기
            </button>
          )}
        </div>
        <span className="text-sm text-gray-500">총 {total}건</span>
      </div>

      {loading ? (
        <p className="text-gray-500">불러오는 중…</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="text-left px-3 py-3 font-semibold text-xs">#</th>
                  <th className="text-left px-3 py-3 font-semibold text-xs">일시</th>
                  <th className="text-left px-3 py-3 font-semibold text-xs">상품명</th>
                  <th className="px-3 py-3 font-semibold text-xs text-center">결과</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => {
                  const { date, time } = formatDate(r.spun_at)
                  return (
                  <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2.5 text-gray-400 text-xs">
                      {total - (page - 1) * PAGE_SIZE - i}
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 font-mono text-xs">
                      <div>{date}</div>
                      <div className="text-gray-400">{time}</div>
                    </td>
                    <td className="px-3 py-2.5 font-medium text-sm">
                      {r.prize_name}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {r.is_winner ? (
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">당첨</span>
                      ) : (
                        <span className="bg-gray-100 text-gray-400 text-xs px-2 py-1 rounded-full">꽝</span>
                      )}
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
            {results.length === 0 && (
              <p className="text-center text-gray-400 py-10">추첨 내역이 없습니다.</p>
            )}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-100 transition-colors"
              >
                이전
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-100 transition-colors"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
