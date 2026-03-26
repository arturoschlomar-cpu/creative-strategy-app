import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

const ANALYSIS_PROMPT = `You are an expert advertising creative analyst. Analyze this ad creative and return ONLY valid JSON in this exact format:
{
  "hook": { "score": <0-100>, "analysis": "<2-3 sentences about the opening hook>" },
  "hold": { "score": <0-100>, "analysis": "<2-3 sentences about retention and pacing>" },
  "conversion": { "score": <0-100>, "analysis": "<2-3 sentences about CTA and conversion elements>" },
  "overall_score": <0-100>,
  "summary": "<1 sentence overall assessment>"
}`;

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

    return NextResponse.json({ id: creative.id });
  } catch (err) {
    console.error("Analyze error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
