import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { GoogleAIFileManager } from '@google/generative-ai/server'
import { writeFile, unlink } from 'fs/promises'
import path from 'path'
import { tmpdir } from 'os'

// Increase timeout for Gemini analysis (60s)
export const maxDuration = 60

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    // Validate Gemini API key is present
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set')
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { fileUrl, mimeType, title, platform, label, metrics } = body

    console.log('[analyze] Request:', { fileUrl: !!fileUrl, mimeType, platform, label, title })

    if (!fileUrl) {
      return NextResponse.json({ error: 'No file URL provided' }, { status: 400 })
    }

    // Auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[analyze] Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized — please sign in again' }, { status: 401 })
    }

    console.log('[analyze] Authenticated user:', user.id)

    // Download file from Supabase Storage
    console.log('[analyze] Downloading file from:', fileUrl)
    const fileResponse = await fetch(fileUrl)
    if (!fileResponse.ok) {
      return NextResponse.json({
        error: `Failed to download file from storage (${fileResponse.status})`
      }, { status: 500 })
    }

    const fileBuffer = Buffer.from(await fileResponse.arrayBuffer())
    const fileSizeMB = fileBuffer.length / (1024 * 1024)
    console.log(`[analyze] File downloaded: ${fileSizeMB.toFixed(1)}MB, type: ${mimeType}`)

    const isVideo = mimeType?.startsWith('video/')

    // Build metrics context for the prompt
    const metricsEntries = metrics
      ? Object.entries(metrics).filter(([, v]) => v !== '' && v !== null && v !== undefined)
      : []
    const metricsContext = metricsEntries.length > 0
      ? `\n\nPerformance metrics provided:\n${metricsEntries.map(([k, v]) => `- ${k}: ${v}`).join('\n')}`
      : '\n\nNo performance metrics provided — analyze the creative visually only.'

    const prompt = `You are an expert performance creative strategist specializing in direct-response digital advertising.

Platform: ${platform || 'meta'}
Label: ${label || 'neutral'}${title ? `\nCreative name: ${title}` : ''}${metricsContext}

Analyze this ${isVideo ? 'video' : 'image'} ad creative and return ONLY a valid JSON object (no markdown code blocks, no explanation, just raw JSON):

{
  "overallScore": <integer 0-100>,
  "hook": {
    "score": <integer 0-100>,
    "type": "<hook type, e.g. Pain Point, Curiosity, Social Proof, Bold Claim, Question>",
    "pattern": "<1-2 sentence description of the hook pattern>",
    "strengths": ["<strength>", "<strength>"],
    "weaknesses": ["<weakness>", "<weakness>"]
  },
  "hold": {
    "score": <integer 0-100>,
    "techniques": ["<technique>", "<technique>"],
    "pacing": "<description of pacing and flow>",
    "narrative": "<description of narrative structure>"
  },
  "conversion": {
    "score": <integer 0-100>,
    "cta": "<description of call-to-action>",
    "offer": "<description of offer/value prop>",
    "urgency": "<description of urgency or scarcity elements>",
    "socialProof": ["<element>"]
  },
  "buildingBlocks": [
    {
      "type": "<hook|body|cta|visual|audio>",
      "label": "<short descriptive label>",
      "description": "<what makes this work or not work>",
      "performance": "<high|medium|low>"
    }
  ],
  "recommendations": [
    "<specific actionable recommendation 1>",
    "<specific actionable recommendation 2>",
    "<specific actionable recommendation 3>"
  ]
}`

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
    let analysisResult

    if (isVideo) {
      // Upload to Gemini File API for videos
      const ext = (mimeType || 'video/mp4').split('/')[1].split(';')[0]
      const tmpFilePath = path.join(tmpdir(), `ad-${Date.now()}.${ext}`)
      await writeFile(tmpFilePath, fileBuffer)

      console.log('[analyze] Uploading video to Gemini File API...')
      try {
        const uploadResponse = await fileManager.uploadFile(tmpFilePath, {
          mimeType,
          displayName: title || 'Ad Creative',
        })

        console.log('[analyze] Gemini file uploaded:', uploadResponse.file.name)

        // Poll until file is processed
        let file = await fileManager.getFile(uploadResponse.file.name)
        let attempts = 0
        while (file.state === 'PROCESSING' && attempts < 30) {
          await new Promise(r => setTimeout(r, 2000))
          file = await fileManager.getFile(uploadResponse.file.name)
          attempts++
          console.log(`[analyze] Video processing... state: ${file.state}`)
        }

        if (file.state === 'FAILED') {
          throw new Error('Gemini video processing failed')
        }

        const result = await model.generateContent([
          { text: prompt },
          {
            fileData: {
              mimeType: file.mimeType,
              fileUri: file.uri,
            }
          }
        ])

        const text = result.response.text().trim()
        console.log('[analyze] Gemini raw response (first 200 chars):', text.substring(0, 200))
        const jsonText = text.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '').trim()
        analysisResult = JSON.parse(jsonText)

        // Clean up Gemini file
        await fileManager.deleteFile(uploadResponse.file.name).catch(() => {})
      } finally {
        await unlink(tmpFilePath).catch(() => {})
      }
    } else {
      // Use inline base64 for images
      const base64 = fileBuffer.toString('base64')
      console.log('[analyze] Sending image to Gemini inline...')

      const result = await model.generateContent([
        { text: prompt },
        {
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: base64,
          }
        }
      ])

      const text = result.response.text().trim()
      console.log('[analyze] Gemini raw response (first 200 chars):', text.substring(0, 200))
      const jsonText = text.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '').trim()
      analysisResult = JSON.parse(jsonText)
    }

    console.log('[analyze] Analysis complete, overallScore:', analysisResult?.overallScore)

    // Save to database
    const adTitle = title?.trim() || 'Untitled Creative'
    const { data: adData, error: adError } = await supabase
      .from('ads')
      .insert({
        user_id: user.id,
        title: adTitle,
        format: isVideo ? 'video' : 'image',
        label: label || 'neutral',
        platform: platform || 'meta',
        metrics: metricsEntries.length > 0
          ? Object.fromEntries(metricsEntries.map(([k, v]) => [k, parseFloat(v as string) || v]))
          : {},
        file_url: fileUrl,
        analysis: analysisResult,
      })
      .select()
      .single()

    if (adError) {
      console.error('[analyze] DB insert error:', adError)
      // Return analysis even if DB save fails
      return NextResponse.json({
        analysis: analysisResult,
        fileUrl,
        warning: `Analysis complete but failed to save: ${adError.message}`,
      })
    }

    console.log('[analyze] Saved to DB, ad id:', adData.id)
    return NextResponse.json({
      id: adData.id,
      analysis: analysisResult,
      fileUrl,
    })

  } catch (error) {
    console.error('[analyze] Error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 })
  }
}
