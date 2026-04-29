import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { collectPlatformProducts } from '@/lib/collectors/naver-platform-products'

export const maxDuration = 60

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const platform = (searchParams.get('platform') ?? '29cm') as '29cm' | 'kidikidi' | 'musinsa'
  const force = searchParams.get('force') === '1'
  const db = createServiceClient()
  const today = new Date().toISOString().split('T')[0]

  // 기존 데이터 확인
  const { count: existingCount, error: countErr } = await db
    .from('platform_products')
    .select('id', { count: 'exact', head: true })
    .eq('platform', platform)
    .eq('captured_date', today)

  // force=1이면 오늘 데이터 삭제 후 재수집
  if (force && existingCount && existingCount > 0) {
    await db.from('platform_products').delete().eq('platform', platform).eq('captured_date', today)
  }

  const count = await collectPlatformProducts(db, platform)

  // 결과 확인
  const { data: samples } = await db
    .from('platform_products')
    .select('*')
    .eq('platform', platform)
    .eq('captured_date', today)
    .order('rank', { ascending: true })
    .limit(5)

  return NextResponse.json({
    platform, today, existingCount, countErr,
    newlyInserted: count,
    samples,
  })
}
