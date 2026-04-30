'use client'

import { useEffect, useState, useCallback } from 'react'
import { FilterState } from './FilterBar'
import { NewsArticle } from '@/lib/supabase'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

type Props = { filters: FilterState }

const SOURCE_TABS = [
  { id: 'all',   label: '전체',    sources: [] as string[] },
  { id: 'dept',  label: '백화점',  sources: ['롯데백화점', '현대백화점', '신세계백화점'] },
  { id: 'fashion', label: '패션미디어', sources: ['어패럴뉴스', '패션비즈', '네이버뉴스'] },
] as const

type SourceTabId = (typeof SOURCE_TABS)[number]['id']

export default function NewsTab({ filters }: Props) {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [sourceTab, setSourceTab] = useState<SourceTabId>('all')

  const fetchNews = useCallback(async (p: number, tab: SourceTabId) => {
    setLoading(true)
    const tabSources = SOURCE_TABS.find(t => t.id === tab)?.sources ?? []
    const params = new URLSearchParams({
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      page: String(p),
      ...(filters.kidsOnly ? { kidsOnly: 'true' } : {}),
      ...(tabSources.length > 0 ? { sources: tabSources.join(',') } : {}),
    })
    const res = await fetch(`/api/news?${params}`)
    const json = await res.json() as { data: NewsArticle[]; count: number }
    setArticles(json.data ?? [])
    setTotal(json.count ?? 0)
    setLoading(false)
  }, [filters])

  useEffect(() => {
    setPage(1)
    fetchNews(1, sourceTab)
  }, [filters, sourceTab, fetchNews])

  const totalPages = Math.ceil(total / 20)

  return (
    <div>
      {/* 소스별 필터 탭 */}
      <div className="flex gap-2 mb-4">
        {SOURCE_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setSourceTab(tab.id); setPage(1) }}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              sourceTab === tab.id
                ? 'bg-white/80 border-white shadow-sm text-[#1a2a3a]'
                : 'text-[#6a8098] border-white/40 hover:border-white/70 hover:bg-white/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-[#9ab4cc] self-center">
          총 <strong className="text-[#1a2a3a]">{total.toLocaleString()}</strong>건
          {loading && ' · 로딩 중...'}
          {filters.kidsOnly && <span className="ml-2 pill-kids">아동 관련만</span>}
        </span>
      </div>

      {/* 기사 목록 */}
      <div className="space-y-3">
        {articles.length === 0 && !loading && (
          <div className="card p-12 text-center text-[#6a8098] text-sm">
            수집된 뉴스가 없습니다. 크론잡을 실행하거나 날짜 범위를 조정해주세요.
          </div>
        )}

        {articles.map(article => (
          <article
            key={article.id}
            className={`card p-4 hover:shadow-sm transition-shadow ${
              article.is_kids ? 'border-l-4 border-l-[#7ae8c0]' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  {article.is_kids && <span className="pill-kids">키즈</span>}
                  <span className="pill-source">{article.source_name}</span>
                  {article.published_at && (
                    <span className="text-xs text-[#6a8098]">
                      {format(new Date(article.published_at), 'M.d (E) HH:mm', { locale: ko })}
                    </span>
                  )}
                </div>

                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm font-semibold text-[#1a2a3a] hover:text-[#2a6a9a] mb-1.5 leading-snug"
                >
                  {article.title}
                </a>

                {article.summary_ai && (
                  <p className="text-xs text-[#6a8098] leading-relaxed">{article.summary_ai}</p>
                )}

                {article.keywords && article.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {article.keywords.map(kw => (
                      <span
                        key={kw}
                        className="text-[10px] px-2 py-0.5 bg-[#C8F0E8] text-[#2a7a5a] rounded-full"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-[#aac4e0] hover:text-[#2a6a9a] mt-1"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>
          </article>
        ))}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-5">
          <button
            onClick={() => { const p = page - 1; setPage(p); fetchNews(p, sourceTab) }}
            disabled={page === 1}
            className="text-xs px-3 py-1.5 border border-white/50 rounded-lg disabled:opacity-40 hover:bg-white/40"
          >
            이전
          </button>
          <span className="text-xs text-[#6a8098]">{page} / {totalPages}</span>
          <button
            onClick={() => { const p = page + 1; setPage(p); fetchNews(p, sourceTab) }}
            disabled={page === totalPages}
            className="text-xs px-3 py-1.5 border border-white/50 rounded-lg disabled:opacity-40 hover:bg-white/40"
          >
            다음
          </button>
        </div>
      )}
    </div>
  )
}
