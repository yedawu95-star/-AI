import { getBrowser, CrawledProduct } from './playwright-crawler'

// 무신사 키즈 인기순 수집
// robots.txt: User-agent: * Disallow: / (내부 업무용 한정, 외부 재배포 금지)
const KIDS_URL = 'https://www.musinsa.com/category/001/0?gf=K&sortCode=POPULAR'

export async function crawlMusinsa(): Promise<CrawledProduct[]> {
  const browser = await getBrowser()
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'ko-KR',
  })
  const page = await context.newPage()
  const results: CrawledProduct[] = []

  try {
    await page.goto(KIDS_URL, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(3000)

    // 무한스크롤 상품 로딩 대기
    await page.waitForSelector('[class*="goods_item"], [class*="GoodsItem"], li[data-goods-no], .list-item', {
      timeout: 10000,
    }).catch(() => null)

    const products = await page.evaluate(() => {
      const items: Array<{ name: string; price: string; image: string; url: string; goodsNo: string }> = []

      // 무신사 상품 카드 셀렉터 (다양한 버전 대응)
      const selectors = [
        'li[data-goods-no]',
        '[class*="goods_item"]',
        '[class*="GoodsItem"]',
        '.list-item',
        'li.item_inner',
      ]

      let cards: NodeListOf<Element> | null = null
      for (const sel of selectors) {
        const found = document.querySelectorAll(sel)
        if (found.length > 2) { cards = found; break }
      }

      if (!cards) {
        // __NEXT_DATA__ 에서 상품 목록 추출 시도
        const nextData = document.getElementById('__NEXT_DATA__')
        if (nextData) {
          try {
            const json = JSON.parse(nextData.textContent ?? '{}')
            const goodsList = json?.props?.pageProps?.dehydratedState?.queries
              ?.flatMap((q: { state?: { data?: { pages?: Array<{ goodsList?: unknown[] }> } } }) =>
                q?.state?.data?.pages?.flatMap((p: { goodsList?: unknown[] }) => p?.goodsList ?? []) ?? []
              ) ?? []
            goodsList.slice(0, 20).forEach((g: {
              goodsName?: string; normalPrice?: number; goodsNo?: number | string;
              thumbnailImageUrl?: string
            }) => {
              items.push({
                name: g.goodsName ?? '',
                price: String(g.normalPrice ?? ''),
                image: g.thumbnailImageUrl ?? '',
                url: `https://www.musinsa.com/products/${g.goodsNo}`,
                goodsNo: String(g.goodsNo ?? ''),
              })
            })
            if (items.length > 0) return items
          } catch { /* fallback to DOM */ }
        }
      }

      if (cards) {
        cards.forEach(card => {
          const goodsNo = card.getAttribute('data-goods-no') ?? ''
          const img = card.querySelector('img, [class*="thumbnail"] img')
          const nameEl = card.querySelector('[class*="goods_name"], [class*="goodsName"], [class*="name"], p.list_info')
          const priceEl = card.querySelector('[class*="sale_price"], [class*="salePrice"], [class*="price"] strong, em.price_num')
          const anchor = card.querySelector('a') as HTMLAnchorElement | null
          items.push({
            name: nameEl?.textContent?.trim() ?? '',
            price: priceEl?.textContent?.trim() ?? '',
            image: img?.getAttribute('src') ?? img?.getAttribute('data-src') ?? '',
            url: anchor?.href ?? (goodsNo ? `https://www.musinsa.com/products/${goodsNo}` : ''),
            goodsNo,
          })
        })
      }

      return items
    })

    products.filter(p => p.name).slice(0, 20).forEach((p, i) => {
      results.push({
        product_name: p.name,
        price: parsePrice(p.price),
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
  const match = text.replace(/,/g, '').match(/\d{4,}/)
  return match ? parseInt(match[0]) : null
}
