import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function summarizeArticle(title: string, content: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `당신은 이랜드리테일 아동 MD를 위한 유통업계 뉴스 요약 전문가입니다.
핵심 내용을 2문장으로 간결하게 요약하세요. 아동/키즈 관련 내용이 있으면 반드시 포함하세요.

제목: ${title}
내용: ${content.slice(0, 1000)}`

  const result = await model.generateContent(prompt)
  return result.response.text()
}
