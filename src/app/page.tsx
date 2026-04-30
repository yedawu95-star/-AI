'use client'

import { useState } from 'react'
import FilterBar, { FilterState } from '@/components/FilterBar'
import NewsTab from '@/components/NewsTab'
import ProductsTab from '@/components/ProductsTab'
import KeywordsTab from '@/components/KeywordsTab'
import CrawlStatus from '@/components/CrawlStatus'
import { format, subDays } from 'date-fns'
import { ko } from 'date-fns/locale'

const TABS = [
  {
    id: 'news',
    label: '백화점3사 이슈',
    sub: '뉴스·이슈 모니터링',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
        <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>
      </svg>
    ),
    accent: 'from-pink-400/80 to-rose-400/80',
    activeBg: 'bg-gradient-to-r from-pink-400/20 to-rose-400/20',
    activeText: 'text-rose-700',
    dot: 'bg-rose-400',
  },
  {
    id: 'products',
    label: '플랫폼 베스트 TOP30',
    sub: '29CM·키디키디·무신사',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
    accent: 'from-teal-400/80 to-cyan-400/80',
    activeBg: 'bg-gradient-to-r from-teal-400/20 to-cyan-400/20',
    activeText: 'text-teal-700',
    dot: 'bg-teal-400',
  },
  {
    id: 'keywords',
    label: '트렌드 키워드',
    sub: '네이버 검색량 분석',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    accent: 'from-violet-400/80 to-purple-400/80',
    activeBg: 'bg-gradient-to-r from-violet-400/20 to-purple-400/20',
    activeText: 'text-violet-700',
    dot: 'bg-violet-400',
  },
] as const

type TabId = (typeof TABS)[number]['id']

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('news')
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    dateTo: format(new Date(), 'yyyy-MM-dd'),
    sources: [],
    channels: [],
    kidsOnly: false,
  })

  const currentTab = TABS.find(t => t.id === activeTab)!
  const today = format(new Date(), 'M월 d일 (E)', { locale: ko })

  return (
    <div className="flex min-h-screen">

      {/* 사이드바 */}
      <aside className="glass-sidebar w-56 shrink-0 flex flex-col sticky top-0 h-screen z-20">
        {/* 로고 */}
        <div className="px-5 pt-7 pb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center shadow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#1a2a3a] leading-tight">이랜드리테일</p>
              <p className="text-[10px] text-[#6a8098]">아동 MD 대시보드</p>
            </div>
          </div>
        </div>

        {/* 구분선 */}
        <div className="mx-4 border-t border-white/50 mb-4" />

        {/* 날짜 */}
        <div className="px-5 mb-5">
          <p className="text-[11px] text-[#6a8098] font-medium">TODAY</p>
          <p className="text-[13px] font-semibold text-[#1a2a3a] mt-0.5">{today}</p>
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 px-3 space-y-1">
          <p className="text-[10px] font-semibold text-[#9ab4cc] uppercase tracking-widest px-2 mb-2">메뉴</p>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all group ${
                activeTab === tab.id
                  ? `${tab.activeBg} ${tab.activeText} shadow-sm`
                  : 'text-[#5a7090] hover:bg-white/30 hover:text-[#1a2a3a]'
              }`}
            >
              <div className={`shrink-0 transition-colors ${
                activeTab === tab.id ? tab.activeText : 'text-[#8aaCc8] group-hover:text-[#4a6a8a]'
              }`}>
                {tab.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold leading-tight truncate">{tab.label}</p>
                <p className={`text-[10px] mt-0.5 truncate ${
                  activeTab === tab.id ? 'opacity-70' : 'text-[#9ab4cc]'
                }`}>{tab.sub}</p>
              </div>
              {activeTab === tab.id && (
                <div className={`ml-auto w-1.5 h-1.5 rounded-full ${tab.dot} shrink-0`} />
              )}
            </button>
          ))}
        </nav>

        {/* 하단 수집 상태 */}
        <div className="p-4 mt-auto">
          <CrawlStatus sidebar />
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 min-w-0 flex flex-col">

        {/* 상단 헤더 */}
        <div className="glass-strong mx-6 mt-6 rounded-2xl px-7 py-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${currentTab.accent}`} />
                <span className="text-xs font-semibold text-[#8aaCc8] uppercase tracking-wider">
                  {currentTab.sub}
                </span>
              </div>
              <h1 className="text-xl font-bold text-[#1a2a3a]">
                {currentTab.label}
              </h1>
              <p className="text-sm text-[#6a8098] mt-1">
                롯데·현대·신세계 유통사 이슈 · 29CM·키디키디·무신사 키즈 베스트 · 네이버 키워드 트렌드
              </p>
            </div>
          </div>
        </div>

        {/* 필터 바 */}
        <div className="mx-6 mt-4">
          <FilterBar filters={filters} onChange={setFilters} activeTab={activeTab} />
        </div>

        {/* 콘텐츠 */}
        <div className="mx-6 mt-4 flex-1 pb-8">
          {activeTab === 'news' && <NewsTab filters={filters} />}
          {activeTab === 'products' && <ProductsTab filters={filters} />}
          {activeTab === 'keywords' && <KeywordsTab filters={filters} />}
        </div>
      </main>
    </div>
  )
}
