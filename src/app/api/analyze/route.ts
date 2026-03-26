import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

// SQL to set up the ads table (run once in Supabase SQL editor):
//
// CREATE TABLE IF NOT EXISTS ads (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
//   title TEXT NOT NULL,
//   platform TEXT DEFAULT 'meta',
//   label TEXT DEFAULT 'neutral',
//   metrics JSONB DEFAULT '{}',
//   file_url TEXT,
//   file_name TEXT,
//   file_type TEXT,
//   analysis JSONB DEFAULT '{}',
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Users can manage own ads" ON ads
//   USING (auth.uid() = user_id)
//   WITH CHECK (auth.uid() = user_id);

const SYSTEM_PROMPT = `You are an expert performance creative strategist. Analyze the provided ad creative using the 3A Framework (Attract/Hook, Absorb/Hold, Act/Convert).

Return ONLY valid JSON with this exact structure, no markdown, no explanation:

{
  "hook": {
    "score": <integer 0-100>,
    "type": "<e.g. Pain Point, Curiosity, Benefit, Social Proof, Controversy>",
    "pattern": "<e.g. Problem-Agitate-Solve, Before-After, How-To>",
    "strengths": ["<strength>", "<strength>"],
    "weaknesses": ["<weakness>"],
    "analysis": "<2-3 sentence analysis of the hook/opening>"
  },
  "hold": {
    "score": <integer 0-100>,
    "techniques": ["<technique>", "<technique>"],
    "pacing": "<Fast|Medium|Slow>",
    "narrative": "<brief narrative description>",
    "analysis": "<2-3 sentence analysis of engagement/retention>"
  },
  "conversion": {
    "score": <integer 0-100>,
    "cta": "<describe the call to action>",
    "offer": "<describe the offer clarity>",
    "urgency": "<describe urgency elements or 'None'>",
    "socialProof": "<describe social proof or 'None'>",
    "analysis": "<2-3 sentence analysis of the conversion elements>"
  },
  "buildingBlocks": [
    { "type": "hook", "label": "<short label>", "description": "<1 sentence>", "performance": "high" },
    { "type": "hold", "label": "<short label>", "description": "<1 sentence>", "performance": "medium" },
    { "type": "conversion", "label": "<short label>", "description": "<1 sentence>", "performance": "low" }
  ],
  "recommendations": [
    "<specific actionable recommendation 1>",
    "<specific actionable recommendation 2>",
    "<specific actionable recommendation 3>"
  ],
  "summary": "<2-3 sentence overall assessment>"
}`

function buildContextText(
  title: string,
  platform: string,
  label: string,
  metrics: Record<string, string>
): string {
  const lines = [
    `Ad Title: ${title || 'Untitled'}`,
    `Platform: ${platform || 'Meta'}`,
    `Performance Label: ${label || 'neutral'}`,
  ]

  const metricNames: Record<string, string> = {
    hookRate: 'Hook Rate (%)',
    holdRate: 'Hold Rate (%)',
    ctr: 'CTR (%)',
    cvr: 'CVR (%)',
    cpa: 'CPA ($)',
    roas: 'ROAS (x)',
    spend: 'Spend ($)',
  }

  if (metrics) {
    Object.entries(metrics).forEach(([key, value]) => {
      if (value && value.toString().trim()) {
        lines.push(`${metricNames[key] || key}: ${value}`)
      }
    })
  }

  return lines.join('\n')
}

function parseGeminiJSON(raw: string): Record<string, unknown> {
  // Try to extract JSON from various formats
  const patterns = [
    /```json\s*([\s\S]*?)\s*```/,
    /```\s*([\s\S]*?)\s*```/,
    /(\{[\s\S]*\})/,
  ]

  for (const pattern of patterns) {
    const match = raw.match(pattern)
    if (match) {
      try {
        return JSON.parse(match[1])
      } catch {
        continue
      }
    }
  }

  // Last resort: try parsing the whole thing
  try {
    return JSON.parse(raw.trim())
  } catch {
    console.error('Could not parse Gemini JSON. Raw (first 500 chars):', raw.substring(0, 500))
    throw new Error('Gemini returned non-JSON response')
  }
}

export async function POST(request: NextRequest) {
  console.log('[analyze] API route called')

  try {
    const body = await request.json()
    const { fileUrl, fileName, fileType, metrics, label, title, platform } = body

    console.log(`[analyze] File: ${fileName} | Type: ${fileType} | Platform: ${platform}`)

    // Auth check
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    console.log('[analyze] User:', user?.id || 'anonymous')

    // Init Gemini
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set')
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

    const isImage = fileType?.startsWith('image/')
    const contextText = buildContextText(title, platform, label, metrics)

    let geminiRaw: string

    if (isImage) {
      console.log('[analyze] Downloading image from Supabase Storage...')
      const imageRes = await fetch(fileUrl)
      if (!imageRes.ok) {
        throw new Error(`Failed to download file: ${imageRes.status} ${imageRes.statusText}`)
      }

      const buffer = await imageRes.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      console.log(`[analyze] Image downloaded: ${(buffer.byteLength / 1024).toFixed(1)} KB`)

      console.log('[analyze] Sending image to Gemini...')
      const result = await model.generateContent([
        { text: SYSTEM_PROMPT + '\n\nAd metadata:\n' + contextText },
        { inlineData: { mimeType: fileType, data: base64 } },
      ])
      geminiRaw = result.response.text()
    } else {
      // Video: analyze based on metadata (visual video analysis requires Files API)
      console.log('[analyze] Video file — analyzing from metadata and performance context...')
      const videoPrompt =
        SYSTEM_PROMPT +
        '\n\nNote: This is a video ad. Analyze based on the provided metadata and performance metrics.\n\nAd metadata:\n' +
        contextText

      const result = await model.generateContent(videoPrompt)
      geminiRaw = result.response.text()
    }

    console.log(`[analyze] Gemini response received (${geminiRaw.length} chars)`)

    // Parse JSON
    const analysis = parseGeminiJSON(geminiRaw)
    console.log('[analyze] Analysis parsed successfully')

    // Save to Supabase
    console.log('[analyze] Saving to database...')
    const { data: ad, error: dbError } = await supabase
      .from('ads')
      .insert({
        user_id: user?.id,
        title: title || fileName || 'Untitled',
        platform: platform || 'meta',
        label: label || 'neutral',
        metrics: metrics || {},
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType,
        analysis,
      })
      .select()
      .single()

    if (dbError) {
      console.error('[analyze] Database error:', dbError)
      throw new Error(
        `Database error: ${dbError.message}. Make sure the 'ads' table exists — see SQL comment at top of this file.`
      )
    }

    console.log('[analyze] Ad saved with ID:', ad.id)
    return NextResponse.json({ adId: ad.id, analysis })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[analyze] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
