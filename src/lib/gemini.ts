import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

export async function analyzeAd(prompt: string): Promise<string> {
  const result = await geminiModel.generateContent(prompt)
  return result.response.text()
}
