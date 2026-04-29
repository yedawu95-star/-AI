import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const periodType = (searchParams.get('periodType') ?? 'weekly') as 'weekly' | 'monthly'
  const keyword = searchParams.get('keyword')

  const db = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  let query = db
    .from('keyword_trends')
    .select('*')
    .eq('period_type', periodType)
    .eq('source', 'datalab')
    .order('period_start', { ascending: false })
    .limit(200)

  if (keyword) query = query.eq('keyword', keyword)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
