import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { collectRss } from '@/lib/collectors/rss'
import { collectNaverKeywords } from '@/lib/collectors/naver-keywords'
import { collectPlatformProducts } from '@/lib/collectors/naver-platform-products'
import { collectRssFashion } from '@/lib/collectors/rss-fashion'

export const maxDuration = 300

type JobResult = { status: string; count: number; error?: string }

export async function POST() {
  const db = createServiceClient()
  const results: Record<string, JobResult> = {}

  // 1. RSS 뉴스
  await run(results, 'rss', () => collectRss(db))

  // 2. 네이버쇼핑 출산/유아동 판매순 TOP 30
  await run(results, 'naver_kids', () => collectPlatformProducts(db, 'naver_kids'))

  // 3. 키워드 트렌드
  await run(results, 'keywords', () => collectNaverKeywords(db))

  // 4. 패션 전문지 RSS (어패럴뉴스·패션비즈·네이버뉴스)
  await run(results, 'rss_fashion', () => collectRssFashion(db))

  // 5. 플랫폼별 상품
  await run(results, '29cm', () => collectPlatformProducts(db, '29cm'))       // 29CM 키즈 ALL 판매순
  await run(results, 'kidikidi', () => collectPlatformProducts(db, 'kidikidi'))  // 키디키디 베스트 랭킹
  await run(results, 'musinsa', () => collectPlatformProducts(db, 'musinsa'))    // 무신사스탠다드 KIDS

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
