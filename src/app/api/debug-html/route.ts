import { NextResponse } from 'next/server'
import { getBrowser, closeBrowser } from '@/lib/collectors/playwright-crawler'

export const maxDuration = 120

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const site = searchParams.get('site') ?? '29cm'

  const URLS: Record<string, string> = {
    '29cm': 'https://www.29cm.co.kr/category/268100',
    'kidikidi': 'https://www.kidikidi.com/best',
    'musinsa': 'https://www.musinsa.com/category/001/0?gf=K&sortCode=POPULAR',
  }

  const url = URLS[site]
  if (!url) return NextResponse.json({ error: 'unknown site' }, { status: 400 })

  const browser = await getBrowser()
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'ko-KR',
  })
  const page = await context.newPage()

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    await new Promise(r => setTimeout(r, 3000))

    const info = await page.evaluate(() => {
      // 상품 관련 요소들 샘플링
      const trySelectors = [
        'li[data-goods-no]', '[class*="GoodsItem"]', '[class*="goods_item"]',
        '[class*="ProductCard"]', '[class*="product_card"]', '[class*="prdList"] li',
        '.goods-list li', 'ul.goods li', '#goods_list li', '.product-item',
        'li.item', 'article', '[class*="ItemCard"]', '[class*="item_card"]',
        'li[class*="Product"]', 'li[class*="goods"]',
      ]
      const results: Record<string, number> = {}
      for (const sel of trySelectors) {
        results[sel] = document.querySelectorAll(sel).length
      }

      // 링크 패턴 확인
      const linkPatterns: Record<string, number> = {}
      for (const pat of ['product_no', 'goods_no', '/product/', '/goods/', '/products/']) {
        linkPatterns[pat] = document.querySelectorAll(`a[href*="${pat}"]`).length
      }

      // 첫 번째 매칭된 셀렉터의 첫 카드 innerHTML
      const firstMatch = trySelectors.find(s => document.querySelectorAll(s).length > 2)
      const sampleHtml = firstMatch
        ? document.querySelectorAll(firstMatch)[0]?.innerHTML?.slice(0, 800)
        : null

      // 전체 body 텍스트 일부
      const bodySnippet = document.body.innerHTML.slice(0, 2000)

      return { results, linkPatterns, firstMatch, sampleHtml, bodySnippet }
    })

    await context.close()
    await closeBrowser().catch(() => null)

    return NextResponse.json({ site, url, ...info })
  } catch (e) {
    await context.close().catch(() => null)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
