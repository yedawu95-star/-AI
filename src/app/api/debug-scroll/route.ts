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
    viewport: { width: 1280, height: 900 },
  })
  const page = await context.newPage()

  const captured: Array<{ url: string; snippet: string }> = []

  page.on('response', async (res) => {
    const ru = res.url()
    const ct = res.headers()['content-type'] ?? ''
    if (ct.includes('json') && (ru.includes('goods') || ru.includes('product') || ru.includes('items') || ru.includes('catalog') || ru.includes('ranking'))) {
      try {
        const body = await res.text()
        captured.push({ url: ru.slice(0, 150), snippet: body.slice(0, 400) })
      } catch { /* */ }
    }
  })

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await new Promise(r => setTimeout(r, 3000))

    // 스크롤 다운 → 상품 lazy load 유발
    await page.evaluate(async () => {
      for (let i = 0; i < 5; i++) {
        window.scrollBy(0, 500)
        await new Promise(r => setTimeout(r, 600))
      }
    })
    await new Promise(r => setTimeout(r, 3000))

    // 상품 카드 셀렉터 광범위 탐색
    const selectorReport = await page.evaluate(() => {
      const result: Record<string, number> = {}
      const candidates = [
        'li[data-goods-no]', 'div[data-goods-no]',
        '[class*="GoodsItem"]', '[class*="goods_item"]', '[class*="ProductCard"]',
        '[class*="product_card"]', '[class*="ItemCard"]', '[class*="item_card"]',
        'li[class*="Product"]', 'li[class*="Goods"]', 'li[class*="Item"]',
        'article', '.item', '.product',
        'ul > li', 'div[class*="Grid"] > div', 'div[class*="grid"] > div',
      ]
      for (const sel of candidates) {
        try { result[sel] = document.querySelectorAll(sel).length } catch { result[sel] = -1 }
      }

      // 이미지 포함한 li 개수
      const liWithImg = Array.from(document.querySelectorAll('li')).filter(li => li.querySelector('img')).length
      result['li_with_img'] = liWithImg

      // 가격처럼 보이는 텍스트 노드 수
      const priceTexts = Array.from(document.querySelectorAll('*')).filter(el => {
        const t = el.textContent ?? ''
        return /\d{4,}원/.test(t) && el.children.length === 0
      }).length
      result['price_text_nodes'] = priceTexts

      return result
    })

    const sampleHtml = await page.evaluate(() => {
      // li with image 샘플
      const li = Array.from(document.querySelectorAll('li')).find(l => l.querySelector('img') && (l.textContent?.length ?? 0) > 10)
      return li?.innerHTML?.slice(0, 600) ?? null
    })

    await context.close()

    return NextResponse.json({ site, url, captured, selectorReport, sampleHtml })
  } catch (e) {
    await context.close().catch(() => null)
    return NextResponse.json({ error: String(e), captured }, { status: 500 })
  }
}
