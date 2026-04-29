import { NextResponse } from 'next/server'
import { crawl29cm } from '@/lib/collectors/crawl-29cm'
import { crawlKidikidi } from '@/lib/collectors/crawl-kidikidi'
import { crawlMusinsa } from '@/lib/collectors/crawl-musinsa'
import { closeBrowser } from '@/lib/collectors/playwright-crawler'

export const maxDuration = 120

export async function GET() {
  const log: string[] = []

  log.push('=== 29CM 시작 ===')
  let cm29: Awaited<ReturnType<typeof crawl29cm>> = []
  try {
    cm29 = await crawl29cm()
    log.push(`29CM 완료: ${cm29.length}개`)
    log.push(JSON.stringify(cm29.slice(0, 2)))
  } catch (e) {
    log.push(`29CM 에러: ${e instanceof Error ? e.message : String(e)}`)
  }

  log.push('=== 키디키디 시작 ===')
  let kidi: Awaited<ReturnType<typeof crawlKidikidi>> = []
  try {
    kidi = await crawlKidikidi()
    log.push(`키디키디 완료: ${kidi.length}개`)
    log.push(JSON.stringify(kidi.slice(0, 2)))
  } catch (e) {
    log.push(`키디키디 에러: ${e instanceof Error ? e.message : String(e)}`)
  }

  log.push('=== 무신사 키즈 시작 ===')
  let musinsa: Awaited<ReturnType<typeof crawlMusinsa>> = []
  try {
    musinsa = await crawlMusinsa()
    log.push(`무신사 완료: ${musinsa.length}개`)
    log.push(JSON.stringify(musinsa.slice(0, 2)))
  } catch (e) {
    log.push(`무신사 에러: ${e instanceof Error ? e.message : String(e)}`)
  }

  await closeBrowser().catch(() => null)

  return NextResponse.json({
    log,
    counts: { '29cm': cm29.length, kidikidi: kidi.length, musinsa: musinsa.length },
  })
}
