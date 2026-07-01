'use client'

import { useState, useEffect } from 'react'
import {
  getAllLimits,
  setDateLimit,
  setDateRangeLimit,
  setDefaultLimit,
  resetAllLimits,
  LIMITS_STORAGE_KEY,
} from '@/lib/daily-limits'

function getKSTToday(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}


export default function DailyLimitCalendar() {
  const [limits, setLimits] = useState<Record<string, number>>({})
  const [viewYear, setViewYear] = useState(0)
  const [viewMonth, setViewMonth] = useState(0)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [limitInput, setLimitInput] = useState('')
  const [applyMode, setApplyMode] = useState<'single' | 'week' | 'all'>('single')
  const [daysInput, setDaysInput] = useState('7')
  const [inputError, setInputError] = useState('')

  const today = getKSTToday()

  useEffect(() => {
    const [y, m] = today.split('-').map(Number)
    setViewYear(y)
    setViewMonth(m - 1)
    setLimits(getAllLimits())

    const onStorage = (e: StorageEvent) => {
      if (e.key === LIMITS_STORAGE_KEY) setLimits(getAllLimits())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [today])

  function getEffective(date: string): number | null {
    if (limits[date] !== undefined) return limits[date]
    if (limits['_default'] !== undefined) return limits['_default']
    return null
  }

  function isExplicit(date: string): boolean {
    return limits[date] !== undefined
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  function handleDayClick(dateStr: string) {
    setSelectedDate(dateStr)
    setLimitInput(limits[dateStr] !== undefined ? String(limits[dateStr]) : '')
    setApplyMode('single')
    setDaysInput('7')
    setInputError('')
  }

  function handleApply() {
    setInputError('')
    let limit: number | null = null
    if (limitInput.trim() !== '') {
      const n = parseInt(limitInput)
      if (isNaN(n) || n < 1) { setInputError('1 이상의 숫자를 입력하세요.'); return }
      limit = n
    }
    if (!selectedDate) return

    if (applyMode === 'single') {
      setDateLimit(selectedDate, limit)
    } else if (applyMode === 'week') {
      const days = parseInt(daysInput)
      if (isNaN(days) || days < 1) { setInputError('적용할 일수를 1 이상으로 입력하세요.'); return }
      setDateRangeLimit(selectedDate, days, limit)
      // 범위가 다음 달로 넘어가면 자동으로 해당 월로 이동
      const endD = new Date(selectedDate + 'T12:00:00')
      endD.setDate(endD.getDate() + days - 1)
      const endYear = endD.getFullYear()
      const endMonth = endD.getMonth()
      if (endYear > viewYear || (endYear === viewYear && endMonth > viewMonth)) {
        setViewYear(endYear)
        setViewMonth(endMonth)
      }
    } else {
      if (limit === null) resetAllLimits()
      else setDefaultLimit(limit)
    }
    setLimits(getAllLimits())
    setSelectedDate(null)
  }

  function handleResetDate() {
    if (!selectedDate) return
    setDateLimit(selectedDate, null)
    setLimits(getAllLimits())
    setSelectedDate(null)
  }

  function handleResetAll() {
    if (!confirm('모든 날짜의 참여 제한을 초기화하시겠습니까?')) return
    resetAllLimits()
    setLimits({})
  }

  // Build calendar cells
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (string | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  }
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  const defaultLimit = limits['_default']

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">일별 참여 제한</h2>
          {defaultLimit !== undefined && (
            <p className="text-xs text-blue-500 mt-0.5">기본값: {defaultLimit}회 (개별 설정이 없는 날에 적용)</p>
          )}
        </div>
        <button
          onClick={handleResetAll}
          className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors"
        >
          전체 리셋
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            ←
          </button>
          <span className="font-bold text-gray-800">{viewYear}년 {viewMonth + 1}월</span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            →
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
            <div key={d} className={`text-center text-xs font-semibold py-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((dateStr, i) => {
            if (!dateStr) return <div key={i} className="min-h-[52px]" />
            const limit = getEffective(dateStr)
            const isToday = dateStr === today
            const explicit = isExplicit(dateStr)
            const fromDefault = !explicit && defaultLimit !== undefined
            const isPast = dateStr < today

            return (
              <button
                key={dateStr}
                onClick={() => handleDayClick(dateStr)}
                className={`
                  flex flex-col items-center justify-center rounded-lg min-h-[52px] text-xs transition-all
                  ${isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                  ${explicit ? 'bg-blue-50 border border-blue-200 hover:bg-blue-100' :
                    fromDefault ? 'bg-gray-50 border border-gray-200 hover:bg-gray-100' :
                    'border border-transparent hover:bg-gray-50'}
                  ${isPast && !isToday ? 'opacity-40' : ''}
                `}
              >
                <span className={`text-sm font-semibold leading-tight ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                  {parseInt(dateStr.slice(8))}
                </span>
                <span className={`text-xs leading-tight font-medium ${explicit ? 'text-blue-500' : fromDefault ? 'text-gray-400' : 'text-gray-300'}`}>
                  {limit !== null ? `${limit}` : '∞'}
                </span>
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-50 border border-blue-200 inline-block flex-shrink-0" />
            개별 설정
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gray-50 border border-gray-200 inline-block flex-shrink-0" />
            기본값 적용
          </span>
          <span className="flex items-center gap-1.5 text-gray-300">
            ∞ 무제한
          </span>
        </div>
      </div>

      {/* Date limit modal */}
      {selectedDate && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
          onClick={() => setSelectedDate(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              {parseInt(selectedDate.slice(5, 7))}월 {parseInt(selectedDate.slice(8))}일 참여 제한
            </h3>
            {isExplicit(selectedDate) && (
              <p className="text-xs text-blue-500 mb-3">현재 설정: {limits[selectedDate]}회</p>
            )}
            {!isExplicit(selectedDate) && defaultLimit !== undefined && (
              <p className="text-xs text-gray-400 mb-3">기본값 적용 중: {defaultLimit}회</p>
            )}
            {!isExplicit(selectedDate) && defaultLimit === undefined && (
              <p className="text-xs text-gray-400 mb-3">현재 무제한 (∞)</p>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-1.5">최대 참여 횟수</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={limitInput}
                  onChange={e => { setLimitInput(e.target.value); setInputError('') }}
                  placeholder="비워두면 무제한 (∞)"
                  className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-sm text-gray-400 whitespace-nowrap">회</span>
              </div>
              {inputError && <p className="text-red-500 text-xs mt-1">{inputError}</p>}
            </div>

            <div className="mb-5">
              <p className="text-sm font-medium text-gray-600 mb-2">적용 범위</p>
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="applyMode" value="single" checked={applyMode === 'single'} onChange={() => setApplyMode('single')} className="w-4 h-4 accent-blue-600" />
                  <span className="text-sm text-gray-700">이 날짜만</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="applyMode" value="week" checked={applyMode === 'week'} onChange={() => setApplyMode('week')} className="w-4 h-4 accent-blue-600" />
                  <span className="text-sm text-gray-700 flex items-center gap-1.5">
                    이 날로부터
                    <input
                      type="number"
                      min={1}
                      value={daysInput}
                      onChange={e => { setDaysInput(e.target.value); setInputError(''); setApplyMode('week') }}
                      onClick={() => setApplyMode('week')}
                      className="w-14 border border-gray-300 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:border-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    일 적용
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="applyMode" value="all" checked={applyMode === 'all'} onChange={() => setApplyMode('all')} className="w-4 h-4 accent-blue-600" />
                  <span className="text-sm text-gray-700">모든 날짜 (기본값으로 설정)</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleResetDate}
                className="flex-1 py-2.5 text-sm border border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition-colors font-medium"
              >
                이 날 리셋
              </button>
              <button
                onClick={() => setSelectedDate(null)}
                className="flex-1 py-2.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleApply}
                className="flex-1 py-2.5 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors font-semibold"
              >
                적용
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
