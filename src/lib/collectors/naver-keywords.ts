import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase'
import { format, subDays } from 'date-fns'

const DATALAB_URL = 'https://openapi.naver.com/v1/datalab/search'
const KEYWORDS = ['아동', '키즈', '유아', '어린이', '아동복']

type DatalabResult = {
  title: string
  data: Array<{ period: string; ratio: number }>
}

export async function collectNaverKeywords(db: SupabaseClient<Database>): Promise<number> {
  const clientId = process.env.NAVER_CLIENT_ID
  const clientSecret = process.env.NAVER_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('Naver API credentials missing')

  const today = new Date()
  const startDate = format(subDays(today, 90), 'yyyy-MM-dd')
  const endDate = format(today, 'yyyy-MM-dd')

  // 데이터랩 API: keywordGroups 최대 5개 제한
  const body = {
    startDate,
    endDate,
    timeUnit: 'week',
    keywordGroups: KEYWORDS.map(kw => ({ groupName: kw, keywords: [kw] })),
  }

  const res = await fetch(DATALAB_URL, {
    method: 'POST',
    headers: {
      'X-Naver-Client-Id': clientId,
      'X-Naver-Client-Secret': clientSecret,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Datalab API error: ${res.status} - ${errText}`)
  }

  const data = await res.json()
  let inserted = 0

  for (const result of data.results as DatalabResult[]) {
    for (const period of result.data) {
      const periodEnd = format(
        new Date(new Date(period.period).getTime() + 6 * 24 * 60 * 60 * 1000),
        'yyyy-MM-dd'
      )
      const { error } = await db.from('keyword_trends').upsert(
        {
          keyword: result.title,
          relative_score: period.ratio,
          source: 'datalab',
          period_type: 'weekly',
          period_start: period.period,
          period_end: periodEnd,
        },
        { onConflict: 'keyword,source,period_type,period_start' }
      )
      if (!error) inserted++
    }
  }

  return inserted
}
