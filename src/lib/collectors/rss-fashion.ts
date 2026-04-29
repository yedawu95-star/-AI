import Parser from 'rss-parser'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase'
import { isKidsRelated, extractKeywords } from '@/lib/kids-keywords'
import { summarizeArticle } from '@/lib/claude'

// Google News RSS를 통한 패션 전문 미디어 수집
// 어패럴뉴스·패션비즈는 자체 RSS가 없어 Google News RSS site: 필터 사용
const RSS_SOURCES = [
  {
    name: '어패럴뉴스',
    url: 'https://news.google.com/rss/search?q=site:apparelnews.co.kr&hl=ko&gl=KR&ceid=KR:ko',
  },
  {
    name: '패션비즈',
    url: 'https://news.google.com/rss/search?q=site:fashionbiz.co.kr&hl=ko&gl=KR&ceid=KR:ko',
  },
  {
    name: '네이버뉴스',
    url: 'https://news.google.com/rss/search?q=%EC%95%84%EB%8F%99%ED%8C%A8%EC%85%98+%ED%82%A4%EC%A6%88%ED%8C%A8%EC%85%98+%EC%9C%A0%EC%95%84%EB%B3%B5&hl=ko&gl=KR&ceid=KR:ko',
    // query: 아동패션 키즈패션 유아복
  },
]

type RssItem = {
  title?: string
  link?: string
  pubDate?: string
  contentSnippet?: string
  content?: string
}

const parser = new Parser<Record<string, unknown>, RssItem>({ timeout: 15000 })

export async function collectRssFashion(db: SupabaseClient<Database>): Promise<number> {
  let totalInserted = 0

  for (const source of RSS_SOURCES) {
    try {
      const feed = await parser.parseURL(source.url)

      for (const item of feed.items.slice(0, 20)) {
        if (!item.title || !item.link) continue

        // Google News 제목 끝의 " - 언론사명" 제거
        const cleanTitle = item.title.replace(/\s*-\s*[^-]+$/, '').trim()
        const snippet = item.contentSnippet ?? ''

        // 중복 확인 (URL 기준)
        const { data: existing } = await db
          .from('news_articles')
          .select('id')
          .eq('url', item.link)
          .single()
        if (existing) continue

        const fullText = `${cleanTitle} ${snippet}`
        const isKids = isKidsRelated(fullText)
        const keywords = extractKeywords(fullText)

        let summaryAi: string | null = null
        try {
          summaryAi = await summarizeArticle(cleanTitle, snippet)
        } catch {
          summaryAi = snippet.slice(0, 120) || null
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
    await delay(300)
  }

  return totalInserted
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
