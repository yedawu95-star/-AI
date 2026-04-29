import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { collectRss } from '@/lib/collectors/rss'
import { collectNaverProducts } from '@/lib/collectors/naver-products'
import { collectNaverKeywords } from '@/lib/collectors/naver-keywords'
import { collectPlatformProducts } from '@/lib/collectors/naver-platform-products'

export const maxDuration = 300

type JobResult = { status: string; count: number; error?: string }

export async function POST() {
  const db = createServiceClient()
  const results: Record<string, JobResult> = {}

  // 1. RSS 뉴스
  await run(results, 'rss', () => collectRss(db))

  // 2. 네이버쇼핑 상품
  await run(results, 'naver_products', () => collectNaverProducts(db))

  // 3. 키워드 트렌드
  await run(results, 'keywords', () => collectNaverKeywords(db))

  // 4. 플랫폼별 상품 (네이버 쇼핑 API 기반)
  await run(results, '29cm', () => collectPlatformProducts(db, '29cm'))
  await run(results, 'kidikidi', () => collectPlatformProducts(db, 'kidikidi'))
  await run(results, 'musinsa', () => collectPlatformProducts(db, 'musinsa'))

  // 크롤 로그 기록
  for (const [name, r] of Object.entries(results)) {
    try {
      await db.from('crawl_logs').insert({
        job_name: name,
        status: (r.status === 'success' ? 'success' : 'error') as 'success' | 'error',
        items_collected: r.count,
        error_msg: r.error ?? null,
        run_at: new Date().toISOString(),
      })
    } catch { /* 로그 실패는 무시 */ }
  }

  return NextResponse.json({ ok: true, results })
}

async function run(
  results: Record<string, JobResult>,
  name: string,
  fn: () => Promise<number>
) {
  try {
    const count = await fn()
    results[name] = { status: 'success', count }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    results[name] = { status: 'error', count: 0, error: msg }
  }
}
