'use client'

import { useEffect, useState, useCallback } from 'react'
import { AdminStats, Prize } from '@/types'
import { BG_THEMES, getSavedBg, saveBg, type BgThemeKey, LANDING_BG_KEY, ROULETTE_BG_KEY } from '@/lib/bg-themes'
import DailyLimitCalendar from '@/components/DailyLimitCalendar'

const emptyForm = {
  name: '',
  total_quantity: '',
  remaining_quantity: '',
  is_unlimited: false,
  is_consolation: false,
  color: '#36A2EB',
}

type FormState = typeof emptyForm

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Prize | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // 확률 인라인 편집용 state
  const [probInputs, setProbInputs] = useState<Record<number, string>>({})
  const [savingProb, setSavingProb] = useState(false)
  const [selectedLandingBg, setSelectedLandingBg] = useState<BgThemeKey>('purple_original')
  const [selectedRouletteBg, setSelectedRouletteBg] = useState<BgThemeKey>('purple_original')

  // 일별 통계
  const [dailyStats, setDailyStats] = useState<{
    today_count: number
    total_count: number
    daily_breakdown: { date: string; count: number }[]
  } | null>(null)
  const [showDailyModal, setShowDailyModal] = useState(false)

  useEffect(() => {
    setSelectedLandingBg(getSavedBg(LANDING_BG_KEY))
    setSelectedRouletteBg(getSavedBg(ROULETTE_BG_KEY))
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [statsRes, prizesRes, dailyRes] = await Promise.all([
      fetch('/api/admin/stats'),
      fetch('/api/admin/prizes'),
      fetch('/api/admin/daily-stats'),
    ])
    const statsData = await statsRes.json()
    const prizesData: Prize[] = await prizesRes.json()
    const dailyData = await dailyRes.json()
    setStats(statsData)
    setPrizes(prizesData)
    setDailyStats(dailyData)
    // 확률 입력값 초기화
    const inputs: Record<number, string> = {}
    prizesData.forEach(p => { inputs[p.id] = String(p.probability ?? 0) })
    setProbInputs(inputs)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // 확률 합계
  const probTotal = prizes.reduce((sum, p) => {
    const v = parseFloat(probInputs[p.id] ?? '0') || 0
    return sum + v
  }, 0)

  const probChanged = prizes.some(p => {
    const current = parseFloat(probInputs[p.id] ?? '0') || 0
    return Math.abs(current - (p.probability ?? 0)) > 0.001
  })

  const handleSaveProb = async () => {
    if (probTotal <= 0) {
      alert('확률을 입력해주세요.')
      return
    }
    if (probTotal < 99 || probTotal > 100) {
      alert(`확률 합계가 ${probTotal.toFixed(1)}%입니다.\n99~100% 사이로 입력해주세요.`)
      return
    }
    setSavingProb(true)
    // 비례 정규화 후 가장 큰 값의 첫 항목이 나머지 흡수 → 합계 정확히 100
    const normalized = prizes.map(p => ({
      id: p.id,
      probability: Math.round(((parseFloat(probInputs[p.id] ?? '0') || 0) / probTotal) * 10000) / 100,
    }))
    const assignedSum = normalized.reduce((s, u) => s + u.probability, 0)
    const remainder = Math.round((100 - assignedSum) * 100) / 100
    const maxVal = Math.max(...normalized.map(u => u.probability))
    const maxIdx = normalized.findIndex(u => u.probability === maxVal)
    if (maxIdx !== -1) normalized[maxIdx].probability = Math.round((normalized[maxIdx].probability + remainder) * 100) / 100
    const updates = normalized
    const res = await fetch('/api/admin/prizes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (res.ok) {
      await fetchAll()
    } else {
      const data = await res.json()
      alert(data.error || '저장 실패')
    }
    setSavingProb(false)
  }

  const openAdd = () => {
    setEditing(null)
    setForm({ ...emptyForm })
    setError('')
    setShowModal(true)
  }

  const openEdit = (p: Prize) => {
    setEditing(p)
    setForm({
      name: p.name,
      total_quantity: String(p.total_quantity),
      remaining_quantity: String(p.remaining_quantity),
      is_unlimited: p.is_unlimited,
      is_consolation: p.is_consolation,
      color: p.color,
    })
    setError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.total_quantity) {
      setError('상품명과 수량은 필수입니다.')
      return
    }
    setSaving(true)
    setError('')

    try {
      const body = {
        name: form.name,
        total_quantity: Number(form.total_quantity),
        remaining_quantity: editing
          ? Number(form.remaining_quantity)
          : Number(form.total_quantity),
        is_unlimited: form.is_unlimited,
        is_consolation: form.is_consolation,
        color: form.color,
        probability: editing ? (editing.probability ?? 0) : 0,
      }

      const url = editing ? `/api/admin/prizes/${editing.id}` : '/api/admin/prizes'
      const method = editing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        setShowModal(false)
        fetchAll()
      } else {
        let msg = '저장 실패'
        try { msg = (await res.json()).error || msg } catch {}
        setError(msg)
      }
    } catch (e) {
      setError((e as Error).message || '네트워크 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?\n관련 당첨 내역이 있으면 삭제가 거부될 수 있습니다.')) return
    const res = await fetch(`/api/admin/prizes/${id}`, { method: 'DELETE' })
    if (res.ok) {
      fetchAll()
    } else {
      const data = await res.json()
      alert(data.error || '삭제 실패')
    }
  }

  if (loading) return <p className="text-gray-500">불러오는 중…</p>

  const probTotalColor =
    Math.abs(probTotal - 100) < 0.01 ? 'text-green-600' :
    probTotal > 100 ? 'text-red-500' : 'text-orange-500'

  return (
    <div className="space-y-8">

      {/* 참여자 통계 카드 */}
      {dailyStats && (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setShowDailyModal(true)}
            className="text-left bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              일일 참여자수
              <span className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs">▾ 일별 보기</span>
            </p>
            <p className="text-3xl font-extrabold text-blue-600">{dailyStats.today_count}<span className="text-base font-normal text-gray-400 ml-1">명</span></p>
          </button>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-gray-500 mb-1">누적 참여자</p>
            <p className="text-3xl font-extrabold text-purple-600">{dailyStats.total_count}<span className="text-base font-normal text-gray-400 ml-1">명</span></p>
          </div>
        </div>
      )}

      {/* 일별 참여자 모달 */}
      {showDailyModal && dailyStats && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
          onClick={() => setShowDailyModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">일별 참여자 현황</h2>
              <button onClick={() => setShowDailyModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
              {dailyStats.daily_breakdown.length === 0 ? (
                <p className="text-gray-400 text-center py-8">데이터가 없습니다.</p>
              ) : dailyStats.daily_breakdown.map(({ date, count }) => (
                <div key={date} className="flex items-center justify-between py-3 px-1">
                  <span className="text-sm text-gray-600 font-mono">{date}</span>
                  <span className="font-bold text-gray-800">{count}<span className="text-gray-400 font-normal text-xs ml-1">명</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 상품 관리 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">상품 관리</h2>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="text-left px-3 py-3 font-semibold hidden sm:table-cell">순서</th>
                <th className="text-left px-3 py-3 font-semibold">상품명</th>
                <th className="px-3 py-3 font-semibold text-center">수량</th>
                <th className="px-2 py-3 font-semibold text-center w-20 sm:w-28">확률(%)</th>
                <th className="px-3 py-3 font-semibold text-center">관리</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }, (_, i) => {
                const p = prizes[i]
                return p ? (
                  <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-3 text-gray-400 hidden sm:table-cell">{i + 1}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{p.name}</span>
                        {p.is_consolation && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">꽝</span>}
                        {p.is_unlimited && <span className="text-xs bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded-full">무제한</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {p.is_unlimited
                        ? <span className="text-blue-500">∞</span>
                        : <span className={p.remaining_quantity === 0 ? 'text-red-500 font-bold' : ''}>{p.remaining_quantity}</span>
                      }
                    </td>
                    <td className="px-2 py-2 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          value={probInputs[p.id] ?? '0'}
                          onChange={e => setProbInputs(prev => ({ ...prev, [p.id]: e.target.value }))}
                          onFocus={e => { if (e.target.value === '0') setProbInputs(prev => ({ ...prev, [p.id]: '' })) }}
                          onBlur={e => { if (e.target.value === '') setProbInputs(prev => ({ ...prev, [p.id]: '0' })) }}
                          className="prob-input w-14 border border-gray-300 rounded-lg px-1.5 py-1 text-center text-sm focus:outline-none focus:border-blue-400"
                        />
                        <span className="text-gray-400 text-xs">%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button onClick={() => openEdit(p)} className="text-blue-600 hover:underline text-sm">수정</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={`empty-${i}`} className="border-t border-gray-100 bg-gray-50/50">
                    <td className="px-3 py-3 text-gray-300 hidden sm:table-cell">{i + 1}</td>
                    <td className="px-3 py-3 text-gray-300 text-sm">— 미설정 —</td>
                    <td className="px-3 py-3 text-center text-gray-300">—</td>
                    <td className="px-2 py-2 text-center text-gray-300">—</td>
                    <td className="px-3 py-3 text-center text-gray-300">—</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* 확률 합계 + 저장 */}
        {prizes.length > 0 && (
          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">확률 합계:</span>
              <span className={`text-lg font-extrabold ${probTotalColor}`}>
                {probTotal.toFixed(1)}%
              </span>
              {probTotal >= 99 && probTotal <= 100 && (
                <span className="text-green-500 text-sm">✓ 정상 범위</span>
              )}
              {probTotal > 100 && (
                <span className="text-red-500 text-sm">100% 초과</span>
              )}
              {probTotal < 99 && probTotal > 0 && (
                <span className="text-orange-500 text-sm">{(100 - probTotal).toFixed(1)}% 부족</span>
              )}
            </div>
            <button
              onClick={handleSaveProb}
              disabled={savingProb || !probChanged}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold px-5 py-2 rounded-xl transition-colors text-sm"
            >
              {savingProb ? '저장 중…' : '확률 저장'}
            </button>
          </div>
        )}
      </div>

      {/* 일별 참여 제한 달력 */}
      <DailyLimitCalendar />

      {/* 배경 색상 선택 */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800">배경 색상</h2>
        {([
          { label: '랜딩페이지', selected: selectedLandingBg, storageKey: LANDING_BG_KEY, setter: setSelectedLandingBg },
          { label: '룰렛페이지', selected: selectedRouletteBg, storageKey: ROULETTE_BG_KEY, setter: setSelectedRouletteBg },
        ] as const).map(({ label, selected, storageKey, setter }) => (
          <div key={label} className="space-y-2">
            <p className="text-sm font-semibold text-gray-600">{label}</p>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
              {Object.values(BG_THEMES).map(bg => {
                const isSelected = selected === bg.key
                return (
                  <button
                    key={bg.key}
                    onClick={() => { saveBg(storageKey, bg.key); setter(bg.key) }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all shrink-0 ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-400 bg-white'
                    }`}
                  >
                    <div
                      className="w-16 h-10 rounded-lg"
                      style={{ background: bg.gradient }}
                    />
                    <span className={`text-xs font-bold ${isSelected ? 'text-blue-600' : 'text-gray-600'}`}>
                      {bg.name}
                    </span>
                    {isSelected && <span className="text-xs text-blue-400">✓ 적용중</span>}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 상품 추가/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-6">{editing ? '상품 수정' : '상품 추가'}</h2>

            <div className="space-y-4">
              <Field label="상품명 (엔터로 줄바꿈)">
                <textarea
                  className="input"
                  rows={2}
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="예) 1등 상품, 꽝"
                  style={{ resize: 'none', lineHeight: '1.4' }}
                />
              </Field>

              <Field label={editing ? '남은 수량' : '수량'}>
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={editing ? form.remaining_quantity : form.total_quantity}
                  onChange={e => setForm(f => editing
                    ? { ...f, remaining_quantity: e.target.value }
                    : { ...f, total_quantity: e.target.value, remaining_quantity: e.target.value }
                  )}
                  placeholder="예) 100"
                />
              </Field>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_unlimited}
                    onChange={e => setForm(f => ({ ...f, is_unlimited: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">수량 무제한</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_consolation}
                    onChange={e => setForm(f => ({ ...f, is_consolation: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">꽝 처리 (당첨 아님)</span>
                </label>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? '저장 중…' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .prob-input::-webkit-inner-spin-button,
        .prob-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .prob-input { -moz-appearance: textfield; }
        .input {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 0.75rem;
          padding: 0.625rem 1rem;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.15s;
        }
        .input:focus {
          border-color: #16a34a;
          box-shadow: 0 0 0 2px rgba(22,163,74,0.15);
        }
      `}</style>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`border rounded-xl p-5 ${color}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-extrabold text-gray-800">{value}</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}
