import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

export const maxDuration = 120;

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

      const isVideo = file.type.startsWith("video/") || file.name.match(/\.(mov|mp4|avi|webm|mkv|m4v)$/i);
      console.log("[analyze] file type:", file.type, "| file name:", file.name, "| isVideo:", isVideo, "| size bytes:", file.size);

      if (isVideo) {
        // Video: upload via File Manager (no inline size limit)
        const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const tmpPath = `/tmp/${storagePath}`;
        const { writeFileSync } = await import("fs");
        writeFileSync(tmpPath, buffer);
        console.log("[analyze] Uploading video to Gemini File Manager...");
        const uploaded = await fileManager.uploadFile(tmpPath, {
          mimeType: file.type || "video/mp4",
          displayName: title,
        });
        console.log("[analyze] File Manager upload done. URI:", uploaded.file.uri, "| state:", uploaded.file.state);

        // Poll until file is ACTIVE (processing can take a few seconds)
        let fileState = uploaded.file.state;
        let attempts = 0;
        while (fileState !== "ACTIVE" && attempts < 20) {
          await new Promise((r) => setTimeout(r, 3000));
          const info = await fileManager.getFile(uploaded.file.name);
          fileState = info.state;
          attempts++;
          console.log(`[analyze] File state poll ${attempts}: ${fileState}`);
        }
        if (fileState !== "ACTIVE") {
          throw new Error(`Gemini file did not become ACTIVE after ${attempts} attempts (state: ${fileState})`);
        }

        parts = [
          { fileData: { mimeType: uploaded.file.mimeType, fileUri: uploaded.file.uri } },
          { text: ANALYSIS_PROMPT },
        ];

        // Cleanup temp file
        try { (await import("fs")).unlinkSync(tmpPath); } catch {}
      } else {
        // Image: inline base64 (warn if > 4MB)
        const MB = 1024 * 1024;
        if (file.size > 4 * MB) {
          console.warn("[analyze] Image is >4MB:", file.size, "bytes. Gemini inline limit is 4MB — may fail.");
        }
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString("base64");
        const mimeType = file.type || "image/jpeg";
        console.log("[analyze] Sending image inline, mimeType:", mimeType, "base64 length:", base64.length);
        parts = [
          { inlineData: { mimeType, data: base64 } },
          { text: ANALYSIS_PROMPT },
        ];
      }

      console.log("[analyze] Calling Gemini generateContent...");
      const result = await model.generateContent(parts);
      const text = result.response.text().trim();
      console.log("[analyze] Gemini raw response (first 500 chars):", text.slice(0, 500));
      // Strip markdown code fences if present
      const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const jsonMatch = stripped.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
        console.log("[analyze] Gemini parsed analysis keys:", Object.keys(analysis));
      } else {
        console.error("[analyze] Gemini response did not contain JSON. Full response:", text.slice(0, 1000));
      }
    } catch (geminiErr) {
      console.error("[analyze] Gemini error:", geminiErr);
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

    const responsePayload = { id: creative.id, analysis, title, platform, label, metrics, fileUrl };
    console.log("[analyze] Returning payload keys:", Object.keys(responsePayload), "| analysis keys:", Object.keys(analysis));
    return NextResponse.json(responsePayload);
  } catch (err) {
    console.error("Analyze error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
