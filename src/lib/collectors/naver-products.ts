import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase'

const NAVER_API_BASE = 'https://openapi.naver.com/v1/search/shop.json'
const KIDS_QUERIES = ['아동복', '키즈패션', '유아복', '어린이옷']

export async function collectNaverProducts(db: SupabaseClient<Database>): Promise<number> {
  const clientId = process.env.NAVER_CLIENT_ID
  const clientSecret = process.env.NAVER_CLIENT_SECRET

  if (!clientId || !clientSecret) throw new Error('Naver API credentials missing')

  let totalInserted = 0
  const today = new Date().toISOString().split('T')[0]

  // 오늘 이미 수집했으면 스킵
  const { count } = await db
    .from('platform_products')
    .select('id', { count: 'exact', head: true })
    .eq('platform', 'naver')
    .eq('captured_date', today)

  if (count && count > 0) return 0

  for (const query of KIDS_QUERIES) {
    const res = await fetch(
      `${NAVER_API_BASE}?query=${encodeURIComponent(query)}&display=10&sort=sim`,
      {
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
        },
      }
    )

    if (!res.ok) continue

    const data = await res.json()
    const items = data.items as NaverShopItem[]

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const price = parseInt(item.lprice, 10) || null

      await db.from('platform_products').insert({
        product_name: stripHtml(item.title),
        price,
        rank: i + 1,
        platform: 'naver',
        image_url: item.image,
        product_url: item.link,
        captured_date: today,
      })

      totalInserted++
    }

    await delay(300)
  }

  return totalInserted
}

type NaverShopItem = {
  title: string
  link: string
  image: string
  lprice: string
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
