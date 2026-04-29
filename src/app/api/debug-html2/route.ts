import { NextResponse } from 'next/server'
import { getBrowser } from '@/lib/collectors/playwright-crawler'

export const maxDuration = 120

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const site = searchParams.get('site') ?? '29cm'

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

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    // 더 오래 대기
    await new Promise(r => setTimeout(r, 5000))

    const info = await page.evaluate(() => {
      // __NEXT_DATA__ 확인
      const nextDataEl = document.getElementById('__NEXT_DATA__')
      const nextDataSnippet = nextDataEl?.textContent?.slice(0, 3000) ?? null

      // 모든 li 요소 중 상품처럼 보이는 것
      const allLi = document.querySelectorAll('li')
      const liInfo = Array.from(allLi).slice(0, 5).map(li => ({
        class: li.className.slice(0, 100),
        hasImg: !!li.querySelector('img'),
        hasA: !!li.querySelector('a'),
        textLen: li.textContent?.length,
      }))

      // data-* 속성이 있는 요소
      const dataAttrs = Array.from(document.querySelectorAll('[data-goods-no],[data-product-id],[data-id],[data-item]'))
        .slice(0, 3).map(el => ({
          tag: el.tagName,
          class: el.className.slice(0, 80),
          attrs: Array.from(el.attributes).map(a => `${a.name}="${a.value.slice(0,30)}"`).join(' ').slice(0, 200),
        }))

      // class에 price, goods, product, item 포함된 요소들
      const relevantClasses = new Set<string>()
      document.querySelectorAll('[class]').forEach(el => {
        const cls = el.className
        if (typeof cls === 'string' && (cls.includes('price') || cls.includes('goods') || cls.includes('product') || cls.includes('item') || cls.includes('Product') || cls.includes('Goods') || cls.includes('Item'))) {
          relevantClasses.add(cls.slice(0, 100))
        }
      })

      const bodyLen = document.body.innerHTML.length
      const bodyEnd = document.body.innerHTML.slice(-1000)

      return { nextDataSnippet, liInfo, dataAttrs, relevantClasses: Array.from(relevantClasses).slice(0, 20), bodyLen, bodyEnd }
    })

    await context.close()

    return NextResponse.json({ site, url, ...info })
  } catch (e) {
    await context.close().catch(() => null)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
