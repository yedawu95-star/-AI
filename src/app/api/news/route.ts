import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const source = searchParams.get('source')
  const sourcesParam = searchParams.get('sources')
  const channel = searchParams.get('channel')
  const kidsOnly = searchParams.get('kidsOnly') === 'true'

  const CHANNEL_SOURCES: Record<string, string[]> = {
    '패션미디어': ['어패럴뉴스', '패션비즈', '네이버뉴스'],
    '백화점': ['롯데백화점', '현대백화점', '신세계백화점'],
    '아울렛': ['롯데아울렛', '사이먼아울렛', '현대아울렛'],
  }
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 20

  const db = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  let query = db
    .from('news_articles')
    .select('*', { count: 'exact' })
    .order('is_kids', { ascending: false })
    .order('published_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (dateFrom) query = query.gte('published_at', dateFrom)
  if (dateTo) query = query.lte('published_at', dateTo + 'T23:59:59')
  const effectiveSources: string[] = []
  if (channel && CHANNEL_SOURCES[channel]) {
    effectiveSources.push(...CHANNEL_SOURCES[channel])
  }
  if (sourcesParam) {
    effectiveSources.push(...sourcesParam.split(',').map(s => s.trim()).filter(Boolean))
  }
  if (source) {
    effectiveSources.push(source)
  }

  if (effectiveSources.length > 0) {
    query = query.in('source_name', [...new Set(effectiveSources)])
  }
  if (kidsOnly) query = query.eq('is_kids', true)

  const { data, count, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, count, page, limit })
}
