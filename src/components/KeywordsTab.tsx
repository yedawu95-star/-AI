'use client'

import { useEffect, useState, useCallback } from 'react'
import { FilterState } from './FilterBar'
import { KeywordTrend } from '@/lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts'

type Props = { filters: FilterState }
type PeriodType = 'weekly' | 'monthly'

const COLORS = ['#B8E4F9', '#F9C8DA', '#C8F0E8', '#DDD0F9', '#FFF0C8', '#aad4f0', '#f0a8c0']

export default function KeywordsTab({ filters }: Props) {
  const [periodType, setPeriodType] = useState<PeriodType>('weekly')
  const [trends, setTrends] = useState<KeywordTrend[]>([])
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchKeywords = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/keywords?periodType=${periodType}`)
    const json = await res.json() as { data: KeywordTrend[] }
    setTrends(json.data ?? [])
    setLoading(false)
  }, [periodType])

  useEffect(() => { fetchKeywords() }, [fetchKeywords])

  // 최근 기간 기준 상위 키워드 바 차트 데이터
  const latestPeriod = [...new Set(trends.map(t => t.period_start))].sort().at(-1)
  const latestTrends = trends
    .filter(t => t.period_start === latestPeriod)
    .sort((a, b) => (b.relative_score ?? 0) - (a.relative_score ?? 0))
    .slice(0, 20)

  const barData = latestTrends.map(t => ({
    keyword: t.keyword,
    score: Number((t.relative_score ?? 0).toFixed(1)),
  }))

  // 선택 키워드 시계열 라인 차트 데이터
  const keywords = [...new Set(trends.map(t => t.keyword))]
  const lineKeywords = selectedKeyword ? [selectedKeyword] : keywords.slice(0, 3)

  const allPeriods = [...new Set(trends.map(t => t.period_start))].sort()
  const lineData = allPeriods.map(period => {
    const row: Record<string, string | number> = { period: period.slice(5) }
    lineKeywords.forEach(kw => {
      const found = trends.find(t => t.period_start === period && t.keyword === kw)
      row[kw] = Number((found?.relative_score ?? 0).toFixed(1))
    })
    return row
  })

  return (
    <div>
      {/* 주간/월간 토글 */}
      <div className="flex items-center gap-2 mb-5">
        {(['weekly', 'monthly'] as const).map(pt => (
          <button
            key={pt}
            onClick={() => setPeriodType(pt)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
              periodType === pt
                ? 'bg-[#DDD0F9] text-[#4a3a9a] border-[#b8a8e8]'
                : 'text-[#6a8098] border-[#e8edf2] hover:border-[#DDD0F9]'
            }`}
          >
            {pt === 'weekly' ? '주간' : '월간'}
          </button>
        ))}
        {loading && <span className="text-xs text-[#6a8098]">로딩 중...</span>}
        {latestPeriod && (
          <span className="text-xs text-[#6a8098] ml-auto">
            최근 기간: <strong className="text-[#1a2a3a]">{latestPeriod}</strong>
          </span>
        )}
      </div>

      {trends.length === 0 && !loading ? (
        <div className="card p-12 text-center text-[#6a8098] text-sm">
          키워드 트렌드 데이터가 없습니다. 크론잡 실행 후 확인해주세요.
        </div>
      ) : (
        <>
          {/* 바 차트: 상위 20개 키워드 */}
          <div className="card p-5 mb-4">
            <h3 className="text-sm font-semibold text-[#1a2a3a] mb-1">
              상위 키워드 상대 검색량
              <span className="text-xs font-normal text-[#6a8098] ml-2">(클릭 시 시계열 추이)</span>
            </h3>
            <p className="text-xs text-[#6a8098] mb-4">
              기준: {latestPeriod} · 네이버 데이터랩
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6a8098' }} />
                <YAxis
                  type="category"
                  dataKey="keyword"
                  width={70}
                  tick={{ fontSize: 11, fill: '#1a2a3a', cursor: 'pointer' }}
                  onClick={({ value }) => setSelectedKeyword(prev => prev === value ? null : value as string)}
                />
                <Tooltip
                  formatter={(v: number) => [`${v}`, '상대 검색량']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e8edf2' }}
                />
                <Bar
                  dataKey="score"
                  fill="#B8E4F9"
                  radius={[0, 4, 4, 0]}
                  cursor="pointer"
                  onClick={(data) => {
                    const kw = data.keyword as string
                    setSelectedKeyword(prev => prev === kw ? null : kw)
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 라인 차트: 시계열 */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-[#1a2a3a] mb-1">
              키워드 시계열 추이
              {selectedKeyword && (
                <span className="ml-2 text-xs font-normal text-[#4a3a9a] bg-[#DDD0F9] px-2 py-0.5 rounded-full">
                  {selectedKeyword}
                </span>
              )}
            </h3>
            <p className="text-xs text-[#6a8098] mb-4">
              {selectedKeyword ? '바 차트에서 다른 키워드를 클릭해 변경' : '최근 상위 3개 키워드'}
            </p>

            {/* 키워드 링크 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {lineKeywords.map(kw => (
                <a
                  key={kw}
                  href={`https://search.naver.com/search.naver?query=${encodeURIComponent(kw + ' 아동')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-2.5 py-1 bg-[#f0f7ff] text-[#2a6a9a] border border-[#aad4f0] rounded-full hover:bg-[#e0f0ff] transition-colors"
                >
                  {kw} 검색 →
                </a>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={lineData} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#6a8098' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6a8098' }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e8edf2' }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {lineKeywords.map((kw, i) => (
                  <Line
                    key={kw}
                    type="monotone"
                    dataKey={kw}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}
