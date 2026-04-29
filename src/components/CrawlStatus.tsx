'use client'

import { useEffect, useState } from 'react'
import { CrawlLog } from '@/lib/supabase'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function CrawlStatus() {
  const [logs, setLogs] = useState<CrawlLog[]>([])
  const [open, setOpen] = useState(false)
  const [triggering, setTriggering] = useState(false)

  useEffect(() => {
    fetch('/api/crawl-logs')
      .then(r => r.json())
      .then((j: { data: CrawlLog[] }) => setLogs(j.data ?? []))
  }, [])

  const latestLog = logs[0]

  async function triggerCollect() {
    setTriggering(true)
    try {
      await fetch('/api/collect', { method: 'POST' })
    } finally {
      setTriggering(false)
      const res = await fetch('/api/crawl-logs')
      const j = await res.json() as { data: CrawlLog[] }
      setLogs(j.data ?? [])
    }
  }

  return (
    <div className="mt-6 card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-2 h-2 rounded-full ${
              latestLog?.status === 'success' ? 'bg-[#3ae8a0]' :
              latestLog?.status === 'error' ? 'bg-[#e85a70]' : 'bg-[#e8c870]'
            }`}
          />
          <div>
            <p className="text-xs font-medium text-[#1a2a3a]">
              데이터 수집 상태
              <span className="ml-2 text-[#6a8098] font-normal">
                매일 AM 7:30 자동 실행
              </span>
            </p>
            {latestLog && (
              <p className="text-xs text-[#6a8098] mt-0.5">
                마지막 수집:{' '}
                {format(new Date(latestLog.run_at), 'M.d HH:mm', { locale: ko })} ·{' '}
                {latestLog.items_collected}건 수집 · {latestLog.job_name}
                {latestLog.status === 'error' && (
                  <span className="ml-1 text-[#e85a70]">오류: {latestLog.error_msg}</span>
                )}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={triggerCollect}
            disabled={triggering}
            className="text-xs px-3 py-1.5 bg-[#f0f7ff] text-[#2a6a9a] border border-[#aad4f0] rounded-lg hover:bg-[#e0f0ff] disabled:opacity-50 transition-colors"
          >
            {triggering ? '수집 중...' : '지금 수집'}
          </button>
          <button
            onClick={() => setOpen(!open)}
            className="text-xs text-[#6a8098] hover:text-[#1a2a3a]"
          >
            {open ? '닫기' : '이력 보기'}
          </button>
        </div>
      </div>

      {open && logs.length > 0 && (
        <div className="mt-3 border-t border-[#e8edf2] pt-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[#6a8098]">
                <th className="text-left pb-2">작업</th>
                <th className="text-left pb-2">상태</th>
                <th className="text-right pb-2">수집</th>
                <th className="text-right pb-2">실행시각</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-t border-[#f0f4f8]">
                  <td className="py-1.5 text-[#1a2a3a]">{log.job_name}</td>
                  <td className="py-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      log.status === 'success' ? 'bg-[#C8F0E8] text-[#1a6a4a]' :
                      log.status === 'error' ? 'bg-[#F9D0E0] text-[#9a3a5a]' :
                      'bg-[#FFF0C8] text-[#7a5a10]'
                    }`}>
                      {log.status === 'success' ? '성공' : log.status === 'error' ? '오류' : '부분'}
                    </span>
                  </td>
                  <td className="py-1.5 text-right text-[#1a2a3a]">{log.items_collected}건</td>
                  <td className="py-1.5 text-right text-[#6a8098]">
                    {format(new Date(log.run_at), 'M.d HH:mm', { locale: ko })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
