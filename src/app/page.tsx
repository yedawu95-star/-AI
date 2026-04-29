'use client'

import { useState } from 'react'
import FilterBar, { FilterState } from '@/components/FilterBar'
import NewsTab from '@/components/NewsTab'
import ProductsTab from '@/components/ProductsTab'
import KeywordsTab from '@/components/KeywordsTab'
import CrawlStatus from '@/components/CrawlStatus'
import { format, subDays } from 'date-fns'

const TABS = [
  { id: 'news', label: '유통사 이슈 뉴스', color: 'bg-[#F9C8DA]', textColor: 'text-[#9a3a5a]' },
  { id: 'products', label: '플랫폼 베스트 상품', color: 'bg-[#C8F0E8]', textColor: 'text-[#2a7a5a]' },
  { id: 'keywords', label: '키워드 트렌드', color: 'bg-[#DDD0F9]', textColor: 'text-[#4a3a9a]' },
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* 헤더 */}
      <div
        className="rounded-2xl p-6 mb-5"
        style={{ background: 'linear-gradient(135deg, #B8E4F9 0%, #F9C8DA 100%)' }}
      >
        <div className="inline-block text-xs font-medium bg-white/70 text-[#5a7fa0] rounded-full px-3 py-1 mb-2">
          이랜드리테일 아동 MD 전용 · 매일 AM 7:30 자동 수집
        </div>
        <h1 className="text-xl font-semibold text-[#2d4a6b] mb-1">
          경쟁사 현황 및 아동 시장 트렌드 대시보드
        </h1>
        <p className="text-sm text-[#6a8fa8]">
          롯데·현대·신세계 유통사 이슈 · 네이버/29CM/키디키디/무신사 키즈 베스트 상품 · 키워드 트렌드
        </p>
      </div>

      {/* 글로벌 필터 바 */}
      <FilterBar filters={filters} onChange={setFilters} activeTab={activeTab} />

      {/* 탭 네비게이션 */}
      <div className="flex gap-2 mb-4 bg-white rounded-xl p-1.5 border border-[#e8edf2]">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? `${tab.color} ${tab.textColor} shadow-sm`
                : 'text-[#6a8098] hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'news' && <NewsTab filters={filters} />}
      {activeTab === 'products' && <ProductsTab filters={filters} />}
      {activeTab === 'keywords' && <KeywordsTab filters={filters} />}

      {/* 수집 상태 */}
      <CrawlStatus />
    </div>
  )
}
