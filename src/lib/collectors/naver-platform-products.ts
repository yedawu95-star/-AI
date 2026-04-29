import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase'

type Platform = '29cm' | 'kidikidi' | 'musinsa' | 'naver_kids'

type NaverShopItem = {
  title: string
  link: string
  image: string
  lprice: string
  mallName: string
  productId: string
}

const NAVER_API = 'https://openapi.naver.com/v1/search/shop.json'

function naverHeaders() {
  return {
    'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID!,
    'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET!,
  }
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, '').trim()
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

async function naverSearch(query: string, display = 100): Promise<NaverShopItem[]> {
  const url = `${NAVER_API}?query=${encodeURIComponent(query)}&display=${display}&sort=sim`
  const res = await fetch(url, { headers: naverHeaders() })
  if (!res.ok) return []
  const data = await res.json()
  return data.items ?? []
}

// ─── 1. 네이버쇼핑 출산/유아동 판매순 TOP 30 ───────────────────────────
async function collectNaverKids(db: SupabaseClient<Database>, today: string): Promise<number> {
  const queries = ['유아동복 판매순', '아동복 인기', '키즈패션 베스트', '유아복 베스트']
  const seen = new Set<string>()
  const items: NaverShopItem[] = []

  for (const q of queries) {
    const results = await naverSearch(q, 100)
    for (const item of results) {
      if (!seen.has(item.productId)) {
        seen.add(item.productId)
        items.push(item)
      }
    }
    if (items.length >= 60) break
    await delay(300)
  }

  const top30 = items.slice(0, 30)
  for (let i = 0; i < top30.length; i++) {
    const item = top30[i]
    await db.from('platform_products').insert({
      product_name: stripHtml(item.title),
      price: parseInt(item.lprice, 10) || null,
      rank: i + 1,
      platform: 'naver_kids',
      image_url: item.image || null,
      product_url: item.link || null,
      captured_date: today,
    })
  }
  return top30.length
}

// ─── 2. 29CM 키즈 ALL 판매순 TOP 30 ──────────────────────────────────
async function collect29cm(db: SupabaseClient<Database>, today: string): Promise<number> {
  // 29CM 내부 API 시도
  let items: { name: string; price: number; url: string; image: string }[] = []

  try {
    const res = await fetch(
      'https://api.29cm.co.kr/product/v2/search?category_large_code=438&sort_type=BEST_SELLING&limit=30&offset=0',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Origin': 'https://www.29cm.co.kr',
          'Referer': 'https://www.29cm.co.kr/',
        }
      }
    )
    if (res.ok) {
      const data = await res.json()
      const list = data?.data?.list ?? data?.items ?? data?.products ?? []
      items = list.slice(0, 30).map((p: Record<string, unknown>) => ({
        name: String(p.item_name ?? p.name ?? p.product_name ?? ''),
        price: Number(p.price ?? p.sale_price ?? 0),
        url: `https://www.29cm.co.kr/product/${p.item_no ?? p.id ?? ''}`,
        image: String(p.item_image ?? p.image_url ?? ''),
      }))
    }
  } catch { /* 폴백 */ }

  // 폴백: 네이버 쇼핑 API로 29CM 상품 검색
  if (items.length < 5) {
    const queries = ['29CM 키즈', '29CM 아동']
    const seen = new Set<string>()
    const naverItems: NaverShopItem[] = []

    for (const q of queries) {
      const results = await naverSearch(q, 100)
      for (const item of results) {
        const mall = item.mallName.toLowerCase()
        if ((mall.includes('29cm') || mall.includes('29 cm')) && !seen.has(item.productId)) {
          seen.add(item.productId)
          naverItems.push(item)
        }
      }
      await delay(300)
    }

    items = naverItems.slice(0, 30).map(item => ({
      name: stripHtml(item.title),
      price: parseInt(item.lprice, 10) || 0,
      url: item.link,
      image: item.image,
    }))
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    await db.from('platform_products').insert({
      product_name: item.name,
      price: item.price || null,
      rank: i + 1,
      platform: '29cm',
      image_url: item.image || null,
      product_url: item.url || null,
      captured_date: today,
    })
  }
  return items.length
}

// ─── 3. 키디키디 베스트 랭킹 TOP 30 ──────────────────────────────────
async function collectKidikidi(db: SupabaseClient<Database>, today: string): Promise<number> {
  const BASE = 'https://kidikidi.elandmall.co.kr'
  let items: { name: string; price: number; url: string }[] = []

  try {
    const res = await fetch(`${BASE}/u/rank`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      }
    })

    if (res.ok) {
      const html = await res.text()

      // 상품 URL 패턴: /i/item?itemNo=XXXXX
      const urlMatches = [...html.matchAll(/href="(\/i\/item\?itemNo=\d+[^"]*)"/g)]

      // 상품명 패턴: 링크 텍스트 (URL 이후 텍스트)
      const productPattern = /href="\/i\/item\?itemNo=(\d+)[^"]*"[^>]*>\s*(?:<[^>]+>)*\s*([^<]{5,80})/g
      const productMatches = [...html.matchAll(productPattern)]

      // 가격 패턴: 숫자,숫자원 또는 숫자원
      const pricePattern = /([\d,]+)원/g
      const prices: number[] = []
      for (const m of html.matchAll(pricePattern)) {
        const n = parseInt(m[1].replace(/,/g, ''), 10)
        if (n > 1000 && n < 1000000) prices.push(n)
      }

      if (productMatches.length > 0) {
        items = productMatches.slice(0, 30).map((m, i) => ({
          name: m[2].trim().replace(/\s+/g, ' '),
          price: prices[i] ?? 0,
          url: `${BASE}${m[1]}`,
        }))
      } else if (urlMatches.length > 0) {
        // 최소한 URL만 있어도 rank 기록
        items = urlMatches.slice(0, 30).map((m, i) => ({
          name: `키디키디 베스트 ${i + 1}위`,
          price: prices[i] ?? 0,
          url: `${BASE}${m[1]}`,
        }))
      }
    }
  } catch { /* 폴백 */ }

  // 폴백: 네이버 API
  if (items.length < 5) {
    const seen = new Set<string>()
    const naverItems: NaverShopItem[] = []
    for (const q of ['키디키디 아동복', '키디키디 유아']) {
      const results = await naverSearch(q, 100)
      for (const item of results) {
        const mall = item.mallName.toLowerCase()
        if ((mall.includes('키디키디') || mall.includes('kidikidi')) && !seen.has(item.productId)) {
          seen.add(item.productId)
          naverItems.push(item)
        }
      }
      await delay(300)
    }
    items = naverItems.slice(0, 30).map(item => ({
      name: stripHtml(item.title),
      price: parseInt(item.lprice, 10) || 0,
      url: item.link,
    }))
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    await db.from('platform_products').insert({
      product_name: item.name,
      price: item.price || null,
      rank: i + 1,
      platform: 'kidikidi',
      image_url: null,
      product_url: item.url || null,
      captured_date: today,
    })
  }
  return items.length
}

// ─── 4. 무신사스탠다드 KIDS (베이비/키즈/주니어) 랭킹 TOP 30 ──────────
async function collectMusinsa(db: SupabaseClient<Database>, today: string): Promise<number> {
  // 무신사 KIDS 카테고리별 내부 API 시도
  const KIDS_CATEGORIES = [
    { code: '001001', name: '베이비패션' },
    { code: '001002', name: '키즈패션' },
    { code: '001003', name: '주니어패션' },
  ]

  let items: { name: string; price: number; url: string; image: string }[] = []

  for (const cat of KIDS_CATEGORIES) {
    try {
      const res = await fetch(
        `https://www.musinsa.com/api2/hq/goods/ranking-list?storeCode=musinsa&categoryCode=${cat.code}&period=NOW&page=1&limit=30`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Referer': 'https://www.musinsa.com/',
          }
        }
      )
      if (res.ok) {
        const data = await res.json()
        const list = data?.data?.list ?? data?.items ?? []
        if (list.length > 0) {
          for (const p of list) {
            items.push({
              name: String(p.goodsName ?? p.name ?? ''),
              price: Number(p.goodsPrice ?? p.normalPrice ?? p.price ?? 0),
              url: `https://www.musinsa.com/app/goods/${p.goodsNo ?? p.id ?? ''}`,
              image: String(p.imageUrl ?? p.thumbnail ?? ''),
            })
          }
        }
      }
    } catch { /* 다음 카테고리 */ }
    await delay(300)
  }

  // 폴백: 네이버 API
  if (items.length < 5) {
    const seen = new Set<string>()
    const naverItems: NaverShopItem[] = []
    for (const q of ['무신사스탠다드 키즈', '무신사 베이비패션', '무신사 주니어']) {
      const results = await naverSearch(q, 100)
      for (const item of results) {
        const mall = item.mallName.toLowerCase()
        if ((mall.includes('무신사') || mall.includes('musinsa')) && !seen.has(item.productId)) {
          seen.add(item.productId)
          naverItems.push(item)
        }
      }
      await delay(300)
    }
    items = naverItems.slice(0, 30).map(item => ({
      name: stripHtml(item.title),
      price: parseInt(item.lprice, 10) || 0,
      url: item.link,
      image: item.image,
    }))
  }

  const top30 = items.slice(0, 30)
  for (let i = 0; i < top30.length; i++) {
    const item = top30[i]
    await db.from('platform_products').insert({
      product_name: item.name,
      price: item.price || null,
      rank: i + 1,
      platform: 'musinsa',
      image_url: item.image || null,
      product_url: item.url || null,
      captured_date: today,
    })
  }
  return top30.length
}

// ─── 공개 진입점 ─────────────────────────────────────────────────────
export async function collectPlatformProducts(
  db: SupabaseClient<Database>,
  platform: Platform
): Promise<number> {
  if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
    throw new Error('Naver API credentials missing')
  }

  const today = new Date().toISOString().split('T')[0]

  // 오늘 이미 수집했으면 스킵
  const { count } = await db
    .from('platform_products')
    .select('id', { count: 'exact', head: true })
    .eq('platform', platform)
    .eq('captured_date', today)
  if (count && count > 0) return 0

  switch (platform) {
    case 'naver_kids': return collectNaverKids(db, today)
    case '29cm':       return collect29cm(db, today)
    case 'kidikidi':   return collectKidikidi(db, today)
    case 'musinsa':    return collectMusinsa(db, today)
  }
}
