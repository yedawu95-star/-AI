export const KIDS_KEYWORDS = [
  '아동', '키즈', '유아', '어린이', '베이비', '유치원', '초등',
  '신생아', '돌잔치', '유아복', '아동복', '키즈패션', '어린이날',
  '육아', '임산부', '태교', '유모차', '카시트',
]

export function extractKeywords(text: string): string[] {
  return KIDS_KEYWORDS.filter(kw => text.includes(kw))
}

export function isKidsRelated(text: string): boolean {
  return KIDS_KEYWORDS.some(kw => text.includes(kw))
}
