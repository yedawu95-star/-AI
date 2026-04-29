import { SupabaseClient } from '@supabase/supabase-js'
import { isKidsRelated, extractKeywords } from '@/lib/kids-keywords'
import { summarizeArticle } from '@/lib/claude'
import { Database } from '@/lib/supabase'

const NAVER_NEWS_URL = 'https://openapi.naver.com/v1/search/news.json'

const SOURCES = [
  { name: '롯데백화점', query: '롯데백화점', category: 'dept' },
  { name: '현대백화점', query: '현대백화점', category: 'dept' },
  { name: '신세계백화점', query: '신세계백화점', category: 'dept' },
  { name: '롯데아울렛', query: '롯데아울렛', category: 'outlet' },
  { name: '사이먼아울렛', query: '사이먼프리미엄아울렛', category: 'outlet' },
  { name: '현대아울렛', query: '현대프리미엄아울렛', category: 'outlet' },
]

type NaverNewsItem = {
  title: string
  link: string
  description: string
  pubDate: string
}

export async function collectRss(db: SupabaseClient<Database>): Promise<number> {
  const clientId = process.env.NAVER_CLIENT_ID
  const clientSecret = process.env.NAVER_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('Naver API credentials missing')

  let totalInserted = 0

  for (const source of SOURCES) {
    try {
      const res = await fetch(
        `${NAVER_NEWS_URL}?query=${encodeURIComponent(source.query)}&display=20&sort=date`,
        {
          headers: {
            'X-Naver-Client-Id': clientId,
            'X-Naver-Client-Secret': clientSecret,
          },
        }
      )
      if (!res.ok) continue

      const data = await res.json()
      const items: NaverNewsItem[] = data.items ?? []

      for (const item of items) {
        if (!item.link || !item.title) continue

        const { data: existing } = await db
          .from('news_articles')
          .select('id')
          .eq('url', item.link)
          .single()
        if (existing) continue

        const cleanTitle = stripHtml(item.title)
        const cleanDesc = stripHtml(item.description)
        const fullText = `${cleanTitle} ${cleanDesc}`
        const isKids = isKidsRelated(fullText)
        const keywords = extractKeywords(fullText)

        let summaryAi: string | null = null
        try {
          summaryAi = await summarizeArticle(cleanTitle, cleanDesc)
        } catch {
          summaryAi = cleanDesc.slice(0, 120)
        }

        await db.from('news_articles').insert({
          title: cleanTitle,
          summary_ai: summaryAi,
          url: item.link,
          source_name: source.name,
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
          keywords,
          is_kids: isKids,
        })
        totalInserted++
        await delay(300)
      }
    } catch {
      continue
    }
    await delay(200)
  }

  return totalInserted
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'")
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
