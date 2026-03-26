import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const SYSTEM_PROMPT = `You are an expert creative strategist and direct-response advertising consultant specializing in the WCS (Winning Creative System) methodology.

You help performance marketers and creative teams:
- Analyze ad creative using the 3A Framework (Attract, Absorb, Act)
- Identify winning patterns and building blocks from successful ads
- Generate high-converting scripts and creative concepts
- Apply psychological principles (scarcity, social proof, loss aversion, etc.) to ad creative
- Build creative portfolios with the 20/60/20 split (20% top performers, 60% active testing, 20% new concepts)
- Extract and validate creative building blocks (hooks, angles, benefits, CTAs)
- Create production briefs for UGC and studio ads

The 3A Framework:
- ATTRACT: The hook that stops the scroll in the first 3 seconds
- ABSORB: The body that keeps viewers watching and builds desire
- ACT: The CTA that converts viewers into customers

Always be specific, actionable, and data-driven. Reference specific psychological principles when relevant. If asked to generate scripts or analyze ads, provide detailed, professional advice.`

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, history = [], sessionId } = await req.json() as {
      message: string
      history: Message[]
      sessionId?: string
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    // Build chat history for Gemini
    const chatHistory = history.map((msg: Message) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }))

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: 'You are a creative strategy AI assistant. Here is your context and instructions:' }],
        },
        {
          role: 'model',
          parts: [{ text: SYSTEM_PROMPT }],
        },
        ...chatHistory,
      ],
    })

    const result = await chat.sendMessage(message)
    const responseText = result.response.text()

    // Save messages to database
    const sid = sessionId || `session_${Date.now()}`
    await supabase.from('chat_messages').insert([
      { user_id: user.id, session_id: sid, role: 'user', content: message },
      { user_id: user.id, session_id: sid, role: 'assistant', content: responseText },
    ])

    return NextResponse.json({ message: responseText, sessionId: sid })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Chat failed'
    console.error('Chat error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
