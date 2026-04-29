import { NextResponse } from 'next/server'
import { getBrowser } from '@/lib/collectors/playwright-crawler'

export const maxDuration = 120

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const site = searchParams.get('site') ?? 'musinsa'

  const URLS: Record<string, string> = {
    '29cm': 'https://www.29cm.co.kr/category/268100',
    'musinsa': 'https://www.musinsa.com/category/001/0?gf=K&sortCode=POPULAR',
  }

  const url = URLS[site]
  if (!url) return NextResponse.json({ error: 'unknown site' }, { status: 400 })

  const browser = await getBrowser()
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'ko-KR',
    extraHTTPHeaders: { 'Accept-Language': 'ko-KR,ko;q=0.9' },
  })
  const page = await context.newPage()

  const allRequests: Array<{ url: string; status: number; contentType: string; bodySnippet: string }> = []

  // 모든 JSON API 응답 캡처
  page.on('response', async (response) => {
    const resUrl = response.url()
    const ct = response.headers()['content-type'] ?? ''
    // 메인 페이지 HTML, 이미지, 폰트 제외
    if (ct.includes('json') && !resUrl.includes('.jpg') && !resUrl.includes('.png')) {
      try {
        const body = await response.text()
        allRequests.push({
          url: resUrl.slice(0, 200),
          status: response.status(),
          contentType: ct.slice(0, 60),
          bodySnippet: body.slice(0, 300),
        })
      } catch { /* skip */ }
    }
  })

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    await new Promise(r => setTimeout(r, 5000))

    await context.close()

    return NextResponse.json({
      site, url,
      totalCaptures: allRequests.length,
      requests: allRequests.slice(0, 20),
    })
  } catch (e) {
    await context.close().catch(() => null)
    return NextResponse.json({ error: String(e), totalCaptures: allRequests.length, requests: allRequests }, { status: 500 })
  }
}
