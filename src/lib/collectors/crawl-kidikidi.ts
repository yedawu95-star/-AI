import { getBrowser, CrawledProduct } from './playwright-crawler'

// 키디키디 베스트 상품 수집
// robots.txt: 없음 (제한 없음), 1회/일 + 딜레이 준수
const BASE_URL = 'https://www.kidikidi.com'
const BEST_URL = 'https://www.kidikidi.com/best'

export async function crawlKidikidi(): Promise<CrawledProduct[]> {
  const browser = await getBrowser()
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'ko-KR',
  })
  const page = await context.newPage()
  const results: CrawledProduct[] = []

  try {
    // 먼저 메인, 실패 시 best 페이지 시도
    let loaded = false
    for (const url of [BEST_URL, `${BASE_URL}/shop/list.php?cate_no=25`, BASE_URL]) {
      try {
        const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
        if (res && res.ok()) { loaded = true; break }
      } catch { continue }
    }
    if (!loaded) return results

    await page.waitForTimeout(2500)

    const products = await page.evaluate(() => {
      const items: Array<{ name: string; price: string; image: string; url: string }> = []

      // 카페24 기반 쇼핑몰 공통 셀렉터
      const selectors = [
        '.prdList li',
        '.goods-list li',
        'ul.goods li',
        '#goods_list li',
        '.product-item',
        'li.item',
      ]

      let cards: NodeListOf<Element> | null = null
      for (const sel of selectors) {
        const found = document.querySelectorAll(sel)
        if (found.length > 2) { cards = found; break }
      }

      if (!cards || cards.length === 0) {
        // 상품 링크 기반 fallback
        document.querySelectorAll('a[href*="product_no"], a[href*="goods_no"], a[href*="/product/"]').forEach(a => {
          const anchor = a as HTMLAnchorElement
          const img = anchor.closest('li, div')?.querySelector('img')
          const nameEl = anchor.closest('li, div')?.querySelector('.name, .goods_name, .prd_name, strong')
          const priceEl = anchor.closest('li, div')?.querySelector('.price, .goods_price, em, span.price')
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
        const nameEl = card.querySelector('.name, .goods_name, .prd_name, .prdName, strong')
        const priceEl = card.querySelector('.price, .goods_price, em.price, span.price')
        if (nameEl?.textContent?.trim()) {
          items.push({
            name: nameEl.textContent.trim(),
            price: priceEl?.textContent?.trim() ?? '',
            image: img?.src ?? img?.getAttribute('data-src') ?? '',
            url: anchor?.href ?? '',
          })
        }
      })
      return items
    })

    products.slice(0, 20).forEach((p, i) => {
      if (!p.name) return
      results.push({
        product_name: p.name,
        price: parsePrice(p.price),
        rank: i + 1,
        image_url: p.image || null,
        product_url: p.url ? (p.url.startsWith('http') ? p.url : BASE_URL + p.url) : null,
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
