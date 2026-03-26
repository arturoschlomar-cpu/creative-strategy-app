import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

const ANALYSIS_PROMPT = `You are an expert advertising creative analyst and performance marketer. Analyze this ad creative thoroughly and return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "hook": { "score": <0-100>, "analysis": "<2-3 sentences about the opening hook>" },
  "hold": { "score": <0-100>, "analysis": "<2-3 sentences about retention and pacing>" },
  "conversion": { "score": <0-100>, "analysis": "<2-3 sentences about CTA and conversion elements>" },
  "overall_score": <0-100>,
  "summary": "<1-2 sentence overall assessment>",
  "ad_format": "<e.g. Short-Form Video, Static Image, Carousel, UGC, etc.>",
  "elements": [
    { "name": "<element name>", "percentage": <0-100> }
  ],
  "visual_breakdown": [
    { "element": "<visual element>", "presence": "<Strong/Present/Weak/Absent>", "impact": "<High/Medium/Low>" }
  ],
  "strategy": {
    "why_it_worked": "<2-3 sentences explaining why this ad works or fails>",
    "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
    "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
    "psychology_principles": ["<principle 1>", "<principle 2>", "<principle 3>"],
    "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"]
  },
  "audience": {
    "persona_name": "<catchy persona name e.g. The Overwhelmed Professional>",
    "persona_description": "<2 sentences describing this ideal customer>",
    "pain_points": ["<pain point 1>", "<pain point 2>", "<pain point 3>", "<pain point 4>"],
    "interests": ["<interest 1>", "<interest 2>", "<interest 3>", "<interest 4>"],
    "demographics": { "age": "<age range>", "gender": "<All/Male/Female>", "income": "<Low/Middle/High>", "location": "<Urban/Suburban/Rural/All>" }
  },
  "growth": {
    "ab_tests": [
      { "name": "<test name>", "hypothesis": "<what to test and why>", "impact": "<High/Medium/Low>" },
      { "name": "<test name>", "hypothesis": "<what to test and why>", "impact": "<High/Medium/Low>" },
      { "name": "<test name>", "hypothesis": "<what to test and why>", "impact": "<High/Medium/Low>" }
    ],
    "scaling_recommendations": ["<recommendation 1>", "<recommendation 2>", "<recommendation 3>"]
  },
  "building_blocks": {
    "hooks": ["<hook variation 1>", "<hook variation 2>", "<hook variation 3>"],
    "angles": ["<angle 1>", "<angle 2>", "<angle 3>"],
    "ctas": ["<cta 1>", "<cta 2>", "<cta 3>"],
    "social_proof": ["<social proof element 1>", "<social proof element 2>", "<social proof element 3>"]
  },
  "emotional_arc": [
    { "label": "0s", "intensity": <0-100>, "emotion": "<emotion name>" },
    { "label": "5s", "intensity": <0-100>, "emotion": "<emotion name>" },
    { "label": "10s", "intensity": <0-100>, "emotion": "<emotion name>" },
    { "label": "15s", "intensity": <0-100>, "emotion": "<emotion name>" },
    { "label": "20s", "intensity": <0-100>, "emotion": "<emotion name>" },
    { "label": "25s", "intensity": <0-100>, "emotion": "<emotion name>" },
    { "label": "30s", "intensity": <0-100>, "emotion": "<emotion name>" }
  ]
}

For elements, include 4-6 structural components (e.g. Hook, Problem Agitation, Solution Demo, Testimonial, CTA, Branding) with percentages summing to 100.
For visual_breakdown, include 5-6 elements like Text Overlay, Brand Logo, Product Shot, Person/Face, Background Music Cue, Motion Graphics.
For emotional_arc, estimate the viewer emotional journey from curiosity to conversion intent across the ad runtime.`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = (formData.get("title") as string) || file?.name || "Untitled";
    const platform = (formData.get("platform") as string) || "meta";
    const label = (formData.get("label") as string) || "neutral";
    const metricsRaw = formData.get("metrics") as string;
    const metrics = metricsRaw ? JSON.parse(metricsRaw) : {};

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const supabase = await createClient();

    // Upload to Supabase storage
    const ext = file.name.split(".").pop() ?? "bin";
    const storagePath = `${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("creatives")
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    let fileUrl = "";
    if (!uploadError) {
      const { data } = supabase.storage.from("creatives").getPublicUrl(storagePath);
      fileUrl = data.publicUrl;
    }
    // Non-fatal: continue even if storage fails

    // Analyze with Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    let analysis: Record<string, unknown> = {};
    try {
      let parts: Parameters<typeof model.generateContent>[0];

      if (file.type.startsWith("video/")) {
        // Video: upload via File Manager
        const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const tmpPath = `/tmp/${storagePath}`;
        const { writeFileSync } = await import("fs");
        writeFileSync(tmpPath, buffer);
        const uploaded = await fileManager.uploadFile(tmpPath, {
          mimeType: file.type,
          displayName: title,
        });
        parts = [
          { fileData: { mimeType: uploaded.file.mimeType, fileUri: uploaded.file.uri } },
          { text: ANALYSIS_PROMPT },
        ];
      } else {
        // Image: inline base64
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString("base64");
        parts = [
          { inlineData: { mimeType: file.type, data: base64 } },
          { text: ANALYSIS_PROMPT },
        ];
      }

      const result = await model.generateContent(parts);
      const text = result.response.text().trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      }
    } catch (geminiErr) {
      console.error("Gemini error:", geminiErr);
      // Fallback: proceed with empty analysis
    }

    // Save to database
    const { data: creative, error: dbError } = await supabase
      .from("ad_creatives")
      .insert({
        title,
        platform,
        label,
        metrics,
        file_url: fileUrl,
        analysis,
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("DB error:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ id: creative.id, analysis, title, platform, label, metrics, fileUrl });
  } catch (err) {
    console.error("Analyze error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
