import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const source = searchParams.get('source')
  const kidsOnly = searchParams.get('kidsOnly') === 'true'
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
  if (source) query = query.eq('source_name', source)
  if (kidsOnly) query = query.eq('is_kids', true)

  const { data, count, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, count, page, limit })
}
