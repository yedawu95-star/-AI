import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase'

const NAVER_API_BASE = 'https://openapi.naver.com/v1/search/shop.json'

type Platform = '29cm' | 'kidikidi' | 'musinsa'

const PLATFORM_QUERIES: Record<Platform, { mallKeywords: string[]; searchQueries: string[] }> = {
  '29cm': {
    mallKeywords: ['29CM', '29cm'],
    searchQueries: ['29CM 키즈', '29CM 아동'],
  },
  'kidikidi': {
    mallKeywords: ['키디키디', 'kidikidi'],
    searchQueries: ['키디키디 아동복', '키디키디 유아'],
  },
  'musinsa': {
    mallKeywords: ['무신사', 'MUSINSA'],
    searchQueries: ['무신사 키즈', '무신사 아동'],
  },
}

type NaverShopItem = {
  title: string
  link: string
  image: string
  lprice: string
  mallName: string
  productId: string
}

export async function collectPlatformProducts(
  db: SupabaseClient<Database>,
  platform: Platform
): Promise<number> {
  const clientId = process.env.NAVER_CLIENT_ID
  const clientSecret = process.env.NAVER_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('Naver API credentials missing')

  const today = new Date().toISOString().split('T')[0]

  const { count } = await db
    .from('platform_products')
    .select('id', { count: 'exact', head: true })
    .eq('platform', platform)
    .eq('captured_date', today)

  if (count && count > 0) return 0

  const config = PLATFORM_QUERIES[platform]
  const collected: NaverShopItem[] = []
  const seen = new Set<string>()

  for (const query of config.searchQueries) {
    const res = await fetch(
      `${NAVER_API_BASE}?query=${encodeURIComponent(query)}&display=100&sort=sim`,
      {
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
        },
      }
    )
    if (!res.ok) continue

    const data = await res.json()
    const items: NaverShopItem[] = data.items ?? []

    for (const item of items) {
      const mallLower = item.mallName.toLowerCase()
      const matches = config.mallKeywords.some(kw => mallLower.includes(kw.toLowerCase()))
      if (matches && !seen.has(item.productId)) {
        seen.add(item.productId)
        collected.push(item)
      }
    }

    await delay(300)
  }

  // 플랫폼 전용 결과가 없으면 쿼리 결과 상위 20개 사용
  let finalItems = collected
  if (finalItems.length < 5) {
    for (const query of config.searchQueries) {
      const res = await fetch(
        `${NAVER_API_BASE}?query=${encodeURIComponent(query)}&display=20&sort=sim`,
        {
          headers: {
            'X-Naver-Client-Id': clientId,
            'X-Naver-Client-Secret': clientSecret,
          },
        }
      )
      if (!res.ok) continue
      const data = await res.json()
      const items: NaverShopItem[] = data.items ?? []
      for (const item of items) {
        if (!seen.has(item.productId)) {
          seen.add(item.productId)
          finalItems.push(item)
        }
      }
      await delay(300)
      break
    }
  }

  let rank = 1
  for (const item of finalItems.slice(0, 20)) {
    const price = parseInt(item.lprice, 10) || null
    await db.from('platform_products').insert({
      product_name: stripHtml(item.title),
      price,
      rank: rank++,
      platform,
      image_url: item.image || null,
      product_url: item.link || null,
      captured_date: today,
    })
  }

  return finalItems.slice(0, 20).length
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
