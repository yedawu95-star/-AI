import { getBrowser, CrawledProduct } from './playwright-crawler'

// 29CM 키즈·베이비 카테고리 베스트 상품 수집
// robots.txt: User-agent: * Allow: / (상품·카테고리 경로 허용)
const KIDS_URLS = [
  'https://www.29cm.co.kr/category/268100', // 키즈
]

export async function crawl29cm(): Promise<CrawledProduct[]> {
  const browser = await getBrowser()
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'ko-KR',
    extraHTTPHeaders: { 'Accept-Language': 'ko-KR,ko;q=0.9' },
  })
  const page = await context.newPage()
  const results: CrawledProduct[] = []

  try {
    await page.goto(KIDS_URLS[0], { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(2000)

    // 상품 카드 추출
    const products = await page.evaluate(() => {
      const items: Array<{
        name: string
        price: string
        image: string
        url: string
      }> = []

      // 29CM 상품 카드 — 여러 셀렉터 시도
      const selectors = [
        'li[class*="GoodsItem"]',
        'li[class*="goods"]',
        '[data-goods-code]',
        'article[class*="product"]',
        'li[class*="Product"]',
      ]

      let cards: NodeListOf<Element> | null = null
      for (const sel of selectors) {
        const found = document.querySelectorAll(sel)
        if (found.length > 0) { cards = found; break }
      }

      if (!cards || cards.length === 0) {
        // 일반 상품 링크 기반 추출 시도
        document.querySelectorAll('a[href*="/product/"]').forEach(a => {
          const anchor = a as HTMLAnchorElement
          const img = anchor.querySelector('img')
          const nameEl = anchor.querySelector('[class*="name"], [class*="title"], [class*="Name"], [class*="Title"]')
          const priceEl = anchor.querySelector('[class*="price"], [class*="Price"]')
          if (nameEl?.textContent?.trim()) {
            items.push({
              name: nameEl.textContent.trim(),
              price: priceEl?.textContent?.trim() ?? '',
              image: img?.src ?? '',
              url: anchor.href,
            })
          }
        })
        return items
      }

      cards.forEach(card => {
        const anchor = card.querySelector('a') as HTMLAnchorElement | null
        const img = card.querySelector('img')
        const nameEl = card.querySelector('[class*="name"], [class*="title"], [class*="Name"], [class*="Title"], [class*="subject"]')
        const priceEl = card.querySelector('[class*="price"], [class*="Price"], [class*="sale"]')
        items.push({
          name: nameEl?.textContent?.trim() ?? '',
          price: priceEl?.textContent?.trim() ?? '',
          image: img?.src ?? img?.getAttribute('data-src') ?? '',
          url: anchor?.href ?? '',
        })
      })
      return items
    })

    products.slice(0, 20).forEach((p, i) => {
      if (!p.name) return
      const price = parsePrice(p.price)
      results.push({
        product_name: p.name,
        price,
        rank: i + 1,
        image_url: p.image || null,
        product_url: p.url || null,
      })
    })
  } finally {
    await context.close()
    await sleep(2000)
  }

  return results
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

function parsePrice(text: string): number | null {
  const match = text.replace(/,/g, '').match(/\d+/)
  return match ? parseInt(match[0]) : null
}
