'use client'

import { exportCsv } from '@/lib/csv'
import { NewsArticle, PlatformProduct, KeywordTrend } from '@/lib/supabase'

export type FilterState = {
  dateFrom: string
  dateTo: string
  sources: string[]
  channels: string[]
  kidsOnly: boolean
}

const SOURCES = ['롯데백화점', '현대백화점', '신세계백화점', '롯데아울렛', '사이먼아울렛', '현대아울렛', '어패럴뉴스', '패션비즈', '네이버뉴스']
const CHANNELS = ['백화점', '아울렛', '플랫폼', '패션미디어']

type Props = {
  filters: FilterState
  onChange: (f: FilterState) => void
  activeTab: string
}

export default function FilterBar({ filters, onChange, activeTab }: Props) {
  function toggle<T extends string>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]
  }

  async function handleCsvDownload() {
    const params = new URLSearchParams({
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      ...(filters.kidsOnly ? { kidsOnly: 'true' } : {}),
    })

    if (filters.sources.length > 0) params.set('sources', filters.sources.join(','))
    if (filters.channels.length === 1) params.set('channel', filters.channels[0])

    if (activeTab === 'news') {
      const res = await fetch(`/api/news?${params}&limit=1000`)
      const { data } = await res.json() as { data: NewsArticle[] }
      exportCsv('유통사뉴스', (data ?? []).map(d => ({
        제목: d.title, AI요약: d.summary_ai ?? '', 출처: d.source_name,
        발행일: d.published_at ?? '', 아동관련: d.is_kids ? 'Y' : 'N',
        키워드: (d.keywords ?? []).join('/'), URL: d.url,
      })))
    } else if (activeTab === 'products') {
      const res = await fetch(`/api/products?${params}`)
      const { data } = await res.json() as { data: PlatformProduct[] }
      exportCsv('베스트상품', (data ?? []).map(d => ({
        플랫폼: d.platform, 랭킹: d.rank ?? '', 상품명: d.product_name,
        가격: d.price ?? '', 수집일: d.captured_date, URL: d.product_url ?? '',
      })))
    } else if (activeTab === 'keywords') {
      const res = await fetch(`/api/keywords?${params}`)
      const { data } = await res.json() as { data: KeywordTrend[] }
      exportCsv('키워드트렌드', (data ?? []).map(d => ({
        키워드: d.keyword, 검색량지수: d.relative_score ?? '', 기간유형: d.period_type,
        시작일: d.period_start, 종료일: d.period_end, 소스: d.source,
      })))
    }
  }

  return (
    <div className="bg-white border border-[#e8edf2] rounded-xl p-4 mb-4">
      <div className="flex flex-wrap gap-4 items-end">
        {/* 날짜 범위 */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#6a8098] font-medium whitespace-nowrap">날짜 범위</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={e => onChange({ ...filters, dateFrom: e.target.value })}
            className="text-sm border border-[#e8edf2] rounded-lg px-3 py-1.5 text-[#1a2a3a] bg-[#f7f9fc] focus:outline-none focus:border-[#B8E4F9]"
          />
          <span className="text-[#6a8098] text-sm">~</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={e => onChange({ ...filters, dateTo: e.target.value })}
            className="text-sm border border-[#e8edf2] rounded-lg px-3 py-1.5 text-[#1a2a3a] bg-[#f7f9fc] focus:outline-none focus:border-[#B8E4F9]"
          />
        </div>

        {/* 유통사 필터 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-[#6a8098] font-medium">유통사</span>
          {SOURCES.map(s => (
            <button
              key={s}
              onClick={() => onChange({ ...filters, sources: toggle(filters.sources, s) })}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                filters.sources.includes(s)
                  ? 'bg-[#B8E4F9] text-[#2a6a9a] border-[#8acae8]'
                  : 'bg-white text-[#6a8098] border-[#e8edf2] hover:border-[#B8E4F9]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* 채널 필터 */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#6a8098] font-medium">채널</span>
          {CHANNELS.map(c => (
            <button
              key={c}
              onClick={() => onChange({ ...filters, channels: toggle(filters.channels, c) })}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                filters.channels.includes(c)
                  ? 'bg-[#F9C8DA] text-[#9a3a5a] border-[#f0a0c0]'
                  : 'bg-white text-[#6a8098] border-[#e8edf2] hover:border-[#F9C8DA]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* 아동 관련만 */}
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.kidsOnly}
            onChange={e => onChange({ ...filters, kidsOnly: e.target.checked })}
            className="rounded"
          />
          <span className="text-xs text-[#6a8098]">아동 관련만</span>
        </label>

        {/* CSV 다운로드 */}
        <button
          onClick={handleCsvDownload}
          className="ml-auto flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-[#f0f7ff] text-[#2a6a9a] border border-[#aad4f0] rounded-lg hover:bg-[#e0f0ff] transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          CSV 다운로드
        </button>
      </div>
    </div>
  )
}
