'use client'

import DailyLimitCalendar from '@/components/DailyLimitCalendar'

export default function DailyLimitPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">일일 참여 제한</h1>
      <DailyLimitCalendar />
    </div>
  )
}
