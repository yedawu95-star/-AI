import { createClient } from '@supabase/supabase-js'

export type NewsArticle = {
  id: number
  title: string
  summary_ai: string | null
  url: string
  source_name: string
  published_at: string | null
  keywords: string[] | null
  is_kids: boolean
  created_at: string
}

export type PlatformProduct = {
  id: number
  product_name: string
  price: number | null
  rank: number | null
  platform: 'naver' | '29cm' | 'kidikidi' | 'musinsa'
  image_url: string | null
  product_url: string | null
  captured_date: string
  created_at: string
}

export type KeywordTrend = {
  id: number
  keyword: string
  relative_score: number | null
  source: 'datalab' | 'blog'
  period_type: 'weekly' | 'monthly'
  period_start: string
  period_end: string
  created_at: string
}

export type CrawlLog = {
  id: number
  job_name: string
  status: 'success' | 'error' | 'partial'
  items_collected: number
  error_msg: string | null
  run_at: string
}

export type RssSource = {
  id: number
  name: string
  rss_url: string
  category: 'dept' | 'outlet'
  is_active: boolean
}

export type Database = {
  public: {
    Tables: {
      news_articles: { Row: NewsArticle; Insert: Omit<NewsArticle, 'id' | 'created_at'>; Update: Partial<NewsArticle> }
      platform_products: { Row: PlatformProduct; Insert: Omit<PlatformProduct, 'id' | 'created_at'>; Update: Partial<PlatformProduct> }
      keyword_trends: { Row: KeywordTrend; Insert: Omit<KeywordTrend, 'id' | 'created_at'>; Update: Partial<KeywordTrend> }
      crawl_logs: { Row: CrawlLog; Insert: Omit<CrawlLog, 'id'>; Update: Partial<CrawlLog> }
      rss_sources: { Row: RssSource; Insert: Omit<RssSource, 'id'>; Update: Partial<RssSource> }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// RLS 비활성화 상태이므로 anon 키로 서버 작업 가능
export function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
