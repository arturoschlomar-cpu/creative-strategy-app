import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { scriptId } = await req.json()
    if (!scriptId) {
      return NextResponse.json({ error: 'scriptId is required' }, { status: 400 })
    }

    const { data: script, error: scriptError } = await supabase
      .from('scripts')
      .select('*')
      .eq('id', scriptId)
      .eq('user_id', user.id)
      .single()

    if (scriptError || !script) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 })
    }

    const prompt = `You are a creative director creating a production brief for a video ad. Based on this script, create a detailed production brief.

SCRIPT:
${JSON.stringify(script.content, null, 2)}

Return ONLY a JSON object (no markdown):

{
  "title": "Brief title",
  "avatar": "Target audience avatar description",
  "angle": "Core creative angle",
  "coreDesire": "The primary desire being addressed",
  "funnelStage": "Awareness | Consideration | Conversion",
  "platform": "${script.platform}",
  "duration": "e.g. 30 seconds",
  "format": "UGC | Studio | Mixed",
  "objective": "Campaign objective",
  "keyMessage": "Single most important message",
  "segments": [
    {
      "segment": "Hook",
      "duration": "0:00-0:03",
      "action": "What talent/presenter does",
      "dialogue": "Exact words to say",
      "visual": "Camera/visual direction",
      "notes": "Director notes"
    }
  ],
  "castingNotes": "Who to cast and why",
  "locationNotes": "Where to film",
  "bRollList": ["b-roll shot 1", "b-roll shot 2"],
  "brandGuidelines": "Branding requirements",
  "deliverables": ["deliverable 1", "deliverable 2"],
  "successMetrics": ["metric 1", "metric 2"]
}`

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    let briefContent
    try {
      const cleaned = responseText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
      briefContent = JSON.parse(cleaned)
    } catch {
      const match = responseText.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Failed to parse brief response')
      briefContent = JSON.parse(match[0])
    }

    const { data: savedBrief, error: briefError } = await supabase
      .from('briefs')
      .insert({
        user_id: user.id,
        script_id: scriptId,
        title: briefContent.title,
        content: briefContent,
        status: 'draft',
      })
      .select()
      .single()

    if (briefError) throw new Error(`Failed to save brief: ${briefError.message}`)

    return NextResponse.json({ success: true, briefId: savedBrief.id, brief: savedBrief })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Brief generation failed'
    console.error('Brief generation error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
