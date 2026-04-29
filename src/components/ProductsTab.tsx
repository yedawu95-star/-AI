'use client'

import { useEffect, useState, useCallback } from 'react'
import { FilterState } from './FilterBar'
import { PlatformProduct } from '@/lib/supabase'
import Image from 'next/image'

type Props = { filters: FilterState }

const PLATFORMS = [
  { id: 'naver', label: '네이버쇼핑', color: '#03C75A' },
  { id: '29cm', label: '29CM', color: '#1a1a1a' },
  { id: 'kidikidi', label: '키디키디', color: '#FF6B6B' },
  { id: 'musinsa', label: '무신사 키즈', color: '#6B47D4' },
] as const

type PlatformId = (typeof PLATFORMS)[number]['id']

export default function ProductsTab({ filters }: Props) {
  const [platform, setPlatform] = useState<PlatformId>('naver')
  const [products, setProducts] = useState<PlatformProduct[]>([])
  const [loading, setLoading] = useState(false)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      platform,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    })
    const res = await fetch(`/api/products?${params}`)
    const json = await res.json() as { data: PlatformProduct[] }
    setProducts(json.data ?? [])
    setLoading(false)
  }, [platform, filters])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  // 날짜별 그룹
  const byDate = products.reduce<Record<string, PlatformProduct[]>>((acc, p) => {
    if (!acc[p.captured_date]) acc[p.captured_date] = []
    acc[p.captured_date].push(p)
    return acc
  }, {})

  const latestDate = Object.keys(byDate).sort().at(-1)
  const displayProducts = latestDate ? byDate[latestDate] : []

  return (
    <div>
      {/* 플랫폼 탭 */}
      <div className="flex gap-2 mb-4">
        {PLATFORMS.map(p => (
          <button
            key={p.id}
            onClick={() => setPlatform(p.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              platform === p.id
                ? 'bg-white border-[#e8edf2] shadow-sm text-[#1a2a3a]'
                : 'text-[#6a8098] border-transparent hover:border-[#e8edf2]'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: p.color }}
            />
            {p.label}
          </button>
        ))}
      </div>

      {latestDate && (
        <p className="text-xs text-[#6a8098] mb-3">
          수집일: <strong className="text-[#1a2a3a]">{latestDate}</strong>
          {' '}&middot; {displayProducts.length}개 상품
          {loading && ' · 로딩 중...'}
        </p>
      )}

      {/* 상품 테이블 */}
      <div className="card overflow-hidden">
        {displayProducts.length === 0 && !loading ? (
          <div className="p-12 text-center text-[#6a8098] text-sm">
            수집된 상품이 없습니다. 크론잡 실행 후 확인해주세요.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f7f9fc] border-b border-[#e8edf2]">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-[#6a8098] w-12">순위</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-[#6a8098]">상품명</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-[#6a8098] w-24">가격</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-[#6a8098] w-16">링크</th>
              </tr>
            </thead>
            <tbody>
              {displayProducts.map((p, idx) => (
                <tr
                  key={p.id}
                  className="border-b border-[#e8edf2] last:border-0 hover:bg-[#f7f9fc] transition-colors"
                >
                  <td className="px-4 py-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-[#FFF0C8] text-[#9a7a10]' :
                        idx === 1 ? 'bg-[#F0F0F0] text-[#555]' :
                        idx === 2 ? 'bg-[#FFE0D0] text-[#9a4a20]' :
                        'text-[#6a8098]'
                      }`}
                    >
                      {idx + 1}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.image_url && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#f0f0f0] shrink-0">
                          <Image
                            src={p.image_url}
                            alt={p.product_name}
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                            unoptimized
                          />
                        </div>
                      )}
                      <span className="text-[#1a2a3a] font-medium leading-snug">{p.product_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.price ? (
                      <span className="font-semibold text-[#2a6a9a]">
                        {p.price.toLocaleString()}원
                      </span>
                    ) : (
                      <span className="text-[#aab8c8]">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.product_url && (
                      <a
                        href={p.product_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#aac4e0] hover:text-[#2a6a9a] inline-flex items-center justify-center"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 29CM · 키디키디 · 무신사 키즈 수집 안내 */}
      {platform !== 'naver' && (
        <div className="mt-3 p-3 bg-[#FFFAF0] border border-[#f0d890] rounded-lg text-xs text-[#9a7a10] leading-relaxed">
          <strong>Playwright 크롤러:</strong> {PLATFORMS.find(p2 => p2.id === platform)?.label} 데이터는 서버에서 1일 1회 수집됩니다.
          내부 업무용으로만 사용하고 외부 공개·재배포는 금지합니다.
        </div>
      )}
    </div>
  )
}
