import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(req: NextRequest) {
  const accessToken = req.cookies.get('sb-access-token')?.value
  const refreshToken = req.cookies.get('sb-refresh-token')?.value

  // /auth/* 경로는 미들웨어 스킵
  if (req.nextUrl.pathname.startsWith('/auth/')) {
    return NextResponse.next()
  }

  // /api/* 경로는 미들웨어 스킵
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // 로그인하지 않음 → 로그인 페이지로
  if (!accessToken) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  // 사용자 승인 상태 확인
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  )

  const { data: user } = await supabase.auth.getUser()

  if (!user?.user) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  const { data: approval } = await supabase
    .from('user_approvals')
    .select('status')
    .eq('user_id', user.user.id)
    .single()

  if (!approval) {
    return NextResponse.redirect(new URL('/auth/pending', req.url))
  }

  if (approval.status === 'pending') {
    return NextResponse.redirect(new URL('/auth/pending', req.url))
  }

  if (approval.status === 'rejected') {
    return NextResponse.redirect(new URL('/auth/rejected', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
