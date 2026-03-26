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

    const { analysisId, platform = 'meta' } = await req.json()
    if (!analysisId) {
      return NextResponse.json({ error: 'analysisId is required' }, { status: 400 })
    }

    // Load analysis
    const { data: analysis, error: analysisError } = await supabase
      .from('ad_analyses')
      .select('*, ads!inner(user_id, title, platform)')
      .eq('id', analysisId)
      .single()

    if (analysisError || !analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }

    // Verify ownership
    if (analysis.ads.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const content = analysis.content as Record<string, unknown>

    const prompt = `You are an expert direct-response copywriter. Based on the following ad analysis, generate a high-converting video ad script.

AD ANALYSIS:
${JSON.stringify(content, null, 2)}

Generate a script for ${platform.toUpperCase()} platform. Return ONLY a JSON object with this structure (no markdown):

{
  "title": "Script title based on the hook strategy",
  "platform": "${platform}",
  "duration": "estimated duration e.g. 30s",
  "hook": {
    "text": "Opening line/voiceover",
    "visual": "What to show on screen",
    "duration": "3s"
  },
  "problem": {
    "text": "Problem/agitation section voiceover",
    "visual": "Visual direction",
    "duration": "5s"
  },
  "solution": {
    "text": "Solution introduction voiceover",
    "visual": "Visual direction",
    "duration": "7s"
  },
  "proof": {
    "text": "Social proof / results section",
    "visual": "Testimonials, stats, demos",
    "duration": "8s"
  },
  "cta": {
    "text": "Call to action",
    "visual": "Product + offer visual",
    "duration": "5s"
  },
  "fullScript": "Complete word-for-word script as one text block",
  "directorNotes": ["note 1", "note 2"],
  "targetAngle": "The main psychological angle this script uses"
}`

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    let scriptContent
    try {
      const cleaned = responseText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
      scriptContent = JSON.parse(cleaned)
    } catch {
      const match = responseText.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Failed to parse script response')
      scriptContent = JSON.parse(match[0])
    }

    const { data: savedScript, error: scriptError } = await supabase
      .from('scripts')
      .insert({
        user_id: user.id,
        ad_analysis_id: analysisId,
        ad_id: analysis.ad_id,
        title: scriptContent.title,
        content: scriptContent,
        platform: platform,
        status: 'draft',
      })
      .select()
      .single()

    if (scriptError) throw new Error(`Failed to save script: ${scriptError.message}`)

    return NextResponse.json({ success: true, scriptId: savedScript.id, script: savedScript })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Script generation failed'
    console.error('Script generation error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const adId = searchParams.get('adId')

    const query = supabase
      .from('scripts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (adId) query.eq('ad_id', adId)

    const { data: scripts, error } = await query
    if (error) throw error

    return NextResponse.json({ scripts })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load scripts'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
