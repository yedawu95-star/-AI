import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { collectRss } from '@/lib/collectors/rss'
import { collectNaverKeywords } from '@/lib/collectors/naver-keywords'
import { collectPlatformProducts } from '@/lib/collectors/naver-platform-products'
import { collectRssFashion } from '@/lib/collectors/rss-fashion'

export const maxDuration = 300

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServiceClient()
  const results: Record<string, { status: string; count: number; error?: string }> = {}

  const run = async (name: string, fn: () => Promise<number>) => {
    try {
      const count = await fn()
      results[name] = { status: 'success', count }
      await db.from('crawl_logs').insert({ job_name: name, status: 'success', items_collected: count })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      results[name] = { status: 'error', count: 0, error: msg }
      await db.from('crawl_logs').insert({ job_name: name, status: 'error', items_collected: 0, error_msg: msg })
    }
  }

  await run('rss', () => collectRss(db))
  await run('naver_kids', () => collectPlatformProducts(db, 'naver_kids'))
  await run('keywords', () => collectNaverKeywords(db))
  await run('rss_fashion', () => collectRssFashion(db))
  await run('29cm', () => collectPlatformProducts(db, '29cm'))
  await run('kidikidi', () => collectPlatformProducts(db, 'kidikidi'))
  await run('musinsa', () => collectPlatformProducts(db, 'musinsa'))

  return NextResponse.json({ ok: true, results })
}
