import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { GoogleAIFileManager } from '@google/generative-ai/server'
import { createClient } from '@/lib/supabase/server'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

export const maxDuration = 120

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!)

const ANALYSIS_PROMPT = `You are an expert direct-response advertising analyst. Analyze this ad creative thoroughly and return a JSON object with this EXACT structure (no markdown, just raw JSON):

{
  "executiveSummary": "2-3 sentence summary of why this ad works or doesn't work",
  "hookAnalysis": {
    "score": <number 0-10>,
    "description": "detailed description of the hook effectiveness",
    "hookType": "Pain Point | Question | Curiosity | Shock | Social Proof | Story | Humor | Other",
    "firstThreeSeconds": "what happens in the first 3 seconds"
  },
  "visualBreakdown": [
    {
      "timeRange": "0:00-0:05",
      "description": "what is shown visually",
      "elements": ["text overlay", "product shot"],
      "emotionalTone": "excitement | curiosity | urgency | calm | etc"
    }
  ],
  "elementDistribution": {
    "testimonial": <percentage as number 0-100>,
    "productDemo": <percentage as number 0-100>,
    "textOverlay": <percentage as number 0-100>,
    "lifestyle": <percentage as number 0-100>,
    "socialProof": <percentage as number 0-100>
  },
  "emotionalArc": [
    { "timestamp": "0:00", "emotion": "curiosity", "intensity": <1-10> }
  ],
  "strategyAnalysis": {
    "whyItWorked": ["reason 1", "reason 2"],
    "successFactors": ["factor 1", "factor 2"],
    "psychologyPrinciples": ["scarcity", "social proof", "fear of missing out"],
    "improvements": ["suggestion 1", "suggestion 2"]
  },
  "audienceAnalysis": {
    "primaryPersona": {
      "name": "e.g. Frustrated Freelancer",
      "age": "25-35",
      "description": "brief persona description",
      "painPoints": ["pain 1", "pain 2"],
      "desires": ["desire 1", "desire 2"]
    },
    "targetDemographics": "brief demographic summary"
  },
  "growthRecommendations": {
    "abTests": [
      {
        "name": "test name",
        "hypothesis": "if we change X then Y will improve because Z",
        "variable": "what to change",
        "expectedImpact": "expected % improvement"
      }
    ],
    "scalingStrategy": "how to scale this ad"
  },
  "buildingBlocks": {
    "hooks": [{ "text": "hook text", "type": "Pain Point | Question | Curiosity" }],
    "angles": [{ "name": "angle name", "epicType": "Emotional | Practical | Identity | Critical" }],
    "benefits": ["benefit 1", "benefit 2"],
    "socialProof": ["proof element 1"],
    "ctas": ["CTA text 1"]
  },
  "adFormat": {
    "duration": "e.g. 30 seconds",
    "format": "UGC | Studio | Mixed",
    "style": "talking head | b-roll | animation | etc",
    "platform": "Meta | TikTok | YouTube | Google"
  }
}

Be specific, actionable, and insightful. Base your analysis entirely on what you observe in the creative.`

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { adId } = await req.json()
    if (!adId) {
      return NextResponse.json({ error: 'adId is required' }, { status: 400 })
    }

    // Load ad from database
    const { data: ad, error: adError } = await supabase
      .from('ads')
      .select('*')
      .eq('id', adId)
      .eq('user_id', user.id)
      .single()

    if (adError || !ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    }

    // Update status to analyzing
    await supabase.from('ads').update({ status: 'analyzing' }).eq('id', adId)

    // Download the file
    const fileResponse = await fetch(ad.file_url)
    if (!fileResponse.ok) {
      throw new Error(`Failed to download file: ${fileResponse.statusText}`)
    }

    const fileBuffer = Buffer.from(await fileResponse.arrayBuffer())
    const mimeType = ad.file_type === 'video' ? 'video/mp4' : 'image/jpeg'
    const isVideo = ad.file_type === 'video'

    let analysisText: string

    if (isVideo) {
      // Upload to Gemini Files API for video
      const ext = ad.file_url.includes('.mov') ? 'mov' : ad.file_url.includes('.webm') ? 'webm' : 'mp4'
      const tmpPath = join(tmpdir(), `ad-${adId}.${ext}`)
      writeFileSync(tmpPath, fileBuffer)

      try {
        const uploadResult = await fileManager.uploadFile(tmpPath, {
          mimeType: mimeType,
          displayName: `ad-${adId}`,
        })

        // Wait for file to be ready
        let geminiFile = uploadResult.file
        let attempts = 0
        while (geminiFile.state === 'PROCESSING' && attempts < 30) {
          await new Promise(r => setTimeout(r, 5000))
          geminiFile = await fileManager.getFile(geminiFile.name)
          attempts++
        }

        if (geminiFile.state !== 'ACTIVE') {
          throw new Error('File processing failed or timed out')
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
        const result = await model.generateContent([
          {
            fileData: {
              mimeType: geminiFile.mimeType,
              fileUri: geminiFile.uri,
            },
          },
          { text: ANALYSIS_PROMPT },
        ])
        analysisText = result.response.text()
      } finally {
        try { unlinkSync(tmpPath) } catch {}
      }
    } else {
      // Inline base64 for images
      const base64 = fileBuffer.toString('base64')
      const imageMime = ad.file_url.includes('.png') ? 'image/png' :
        ad.file_url.includes('.gif') ? 'image/gif' :
        ad.file_url.includes('.webp') ? 'image/webp' : 'image/jpeg'

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: imageMime,
            data: base64,
          },
        },
        { text: ANALYSIS_PROMPT },
      ])
      analysisText = result.response.text()
    }

    // Parse the JSON response
    let analysis
    try {
      // Strip any markdown code fences if present
      const cleaned = analysisText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
      analysis = JSON.parse(cleaned)
    } catch {
      // Try to extract JSON from the response
      const match = analysisText.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Failed to parse Gemini response as JSON')
      analysis = JSON.parse(match[0])
    }

    // Save analysis to database
    const { data: savedAnalysis, error: analysisError } = await supabase
      .from('ad_analyses')
      .insert({
        ad_id: adId,
        analysis_type: 'full',
        content: analysis,
        model_used: 'gemini-1.5-flash',
      })
      .select()
      .single()

    if (analysisError) throw new Error(`Failed to save analysis: ${analysisError.message}`)

    // Extract and save building blocks
    const blocks = analysis.buildingBlocks
    if (blocks) {
      const blockRows = [
        ...(blocks.hooks || []).map((h: { text: string; type: string }) => ({
          user_id: user.id,
          ad_id: adId,
          type: 'hook',
          content: h.text,
          metadata: { hookType: h.type },
        })),
        ...(blocks.angles || []).map((a: { name: string; epicType: string }) => ({
          user_id: user.id,
          ad_id: adId,
          type: 'angle',
          content: a.name,
          metadata: { epicType: a.epicType },
        })),
        ...(blocks.benefits || []).map((b: string) => ({
          user_id: user.id,
          ad_id: adId,
          type: 'benefit',
          content: b,
          metadata: {},
        })),
        ...(blocks.socialProof || []).map((s: string) => ({
          user_id: user.id,
          ad_id: adId,
          type: 'social_proof',
          content: s,
          metadata: {},
        })),
        ...(blocks.ctas || []).map((c: string) => ({
          user_id: user.id,
          ad_id: adId,
          type: 'cta',
          content: c,
          metadata: {},
        })),
      ]

      if (blockRows.length > 0) {
        await supabase.from('building_blocks').insert(blockRows)
      }
    }

    // Update ad status to analyzed
    await supabase.from('ads').update({ status: 'analyzed' }).eq('id', adId)

    return NextResponse.json({ success: true, analysisId: savedAnalysis.id, analysis })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analysis failed'
    console.error('Analyze error:', err)

    // Try to mark ad as failed
    try {
      const supabase = await createClient()
      const body = await req.json().catch(() => ({}))
      if (body.adId) {
        await supabase.from('ads').update({ status: 'failed' }).eq('id', body.adId)
      }
    } catch {}

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
