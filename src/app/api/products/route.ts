import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const platform = searchParams.get('platform') ?? 'naver'
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')

  const db = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  let query = db
    .from('platform_products')
    .select('*')
    .eq('platform', platform)
    .order('captured_date', { ascending: false })
    .order('rank', { ascending: true })
    .limit(50)

  if (dateFrom) query = query.gte('captured_date', dateFrom)
  if (dateTo) query = query.lte('captured_date', dateTo)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
