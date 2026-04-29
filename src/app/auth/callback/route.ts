import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/auth/error', req.url))
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL('/auth/error', req.url))
  }

  const user = data.user
  if (!user?.email) {
    return NextResponse.redirect(new URL('/auth/error', req.url))
  }

  // 첫 로그인 시 user_approvals에 레코드 생성
  const { data: existing } = await supabase
    .from('user_approvals')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!existing) {
    await supabase.from('user_approvals').insert({
      user_id: user.id,
      email: user.email,
      display_name: user.user_metadata?.full_name || user.email,
      status: 'pending',
    })
  }

  // Set auth cookie and redirect
  const response = NextResponse.redirect(new URL('/', req.url))
  response.cookies.set('sb-access-token', data.session.access_token)
  response.cookies.set('sb-refresh-token', data.session.refresh_token)

  return response
}
