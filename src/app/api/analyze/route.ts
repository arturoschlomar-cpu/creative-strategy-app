import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    console.log('[analyze] Starting...');

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('[analyze] File:', file.name, file.size, file.type);

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 20MB for now.' }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    console.log('[analyze] Base64 length:', base64.length);

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    console.log('[analyze] Calling Gemini...');

    const prompt = `You are an expert ad creative analyst. Analyze this ad creative in detail.

Return a JSON object with this exact structure:
{
  "executiveSummary": "2-3 sentence summary of the ad and why it works or doesn't",
  "hookScore": 7,
  "hookAnalysis": "Description of the hook and first 3 seconds",
  "format": "UGC/Studio/Mixed",
  "duration": "estimated duration",
  "visualBreakdown": [
    {"time": "0:00-0:03", "description": "what happens", "elements": ["element1"]}
  ],
  "emotionalArc": [
    {"time": "0:00", "emotion": "curiosity", "intensity": 7}
  ],
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "psychologyPrinciples": ["principle1", "principle2"],
  "targetAudience": {"age": "25-34", "gender": "Female", "interests": ["interest1"]},
  "buildingBlocks": {
    "hooks": ["hook text 1"],
    "angles": ["angle 1"],
    "ctas": ["cta 1"],
    "socialProof": ["proof element 1"]
  },
  "improvements": ["suggestion1", "suggestion2"],
  "abTestIdeas": [
    {"name": "Test name", "hypothesis": "What to test", "expectedImpact": "High/Medium/Low"}
  ]
}

IMPORTANT: Return ONLY valid JSON, no markdown, no code blocks.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: file.type,
          data: base64,
        },
      },
    ]);

    console.log('[analyze] Gemini responded');

    const text = result.response.text();
    console.log('[analyze] Raw response length:', text.length);

    let analysis;
    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleaned);
    } catch (e) {
      console.error('[analyze] JSON parse error:', e);
      analysis = { executiveSummary: text, hookScore: 5 };
    }

    console.log('[analyze] Success!');

    return NextResponse.json({
      id: crypto.randomUUID(),
      analysis,
      fileName: file.name,
      fileType: file.type,
    });
  } catch (error) {
    console.error('[analyze] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
