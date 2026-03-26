"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { AdUpload } from "@/components/ad-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, Trophy, Minus, TrendingDown } from "lucide-react";

type Label = "winner" | "loser" | "neutral";

interface Metrics {
  hookRate: string;
  holdRate: string;
  ctr: string;
  cvr: string;
  cpa: string;
  roas: string;
  spend: string;
}

const labelOptions: { value: Label; label: string; icon: React.ReactNode; color: string }[] = [
  {
    value: "winner",
    label: "Winner",
    icon: <Trophy className="h-4 w-4" />,
    color: "border-[#FCD202] bg-[#FCD202]/10 text-[#FCD202]",
  },
  {
    value: "neutral",
    label: "Neutral",
    icon: <Minus className="h-4 w-4" />,
    color: "border-[#2A3140] bg-[#1E2530] text-[#8693A8]",
  },
  {
    value: "loser",
    label: "Loser",
    icon: <TrendingDown className="h-4 w-4" />,
    color: "border-red-500/40 bg-red-500/10 text-red-400",
  },
];

const metricFields = [
  { key: "hookRate", label: "Hook Rate", placeholder: "e.g. 35", suffix: "%" },
  { key: "holdRate", label: "Hold Rate", placeholder: "e.g. 45", suffix: "%" },
  { key: "ctr", label: "CTR", placeholder: "e.g. 2.4", suffix: "%" },
  { key: "cvr", label: "CVR", placeholder: "e.g. 3.1", suffix: "%" },
  { key: "cpa", label: "CPA", placeholder: "e.g. 42", prefix: "$" },
  { key: "roas", label: "ROAS", placeholder: "e.g. 3.8", suffix: "x" },
  { key: "spend", label: "Spend", placeholder: "e.g. 1200", prefix: "$" },
];

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState<Label>("neutral");
  const [platform, setPlatform] = useState<string>("meta");
  const [title, setTitle] = useState("");
  const [metrics, setMetrics] = useState<Metrics>({
    hookRate: "",
    holdRate: "",
    ctr: "",
    cvr: "",
    cpa: "",
    roas: "",
    spend: "",
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMetric = (key: keyof Metrics, value: string) => {
    setMetrics((m) => ({ ...m, [key]: value }));
  };

  const handleAnalyze = async () => {
    if (!file) return;

    console.log("[analyze page] File selected:", file.name, "type:", file.type, "size:", file.size);

    // Warn about large images (>4MB Gemini inline limit)
    const isVideo = file.type.startsWith("video/") || /\.(mov|mp4|avi|webm|mkv|m4v)$/i.test(file.name);
    const MB = 1024 * 1024;
    if (!isVideo && file.size > 4 * MB) {
      setError("Image files must be under 4 MB. Please compress or resize the image before uploading.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title);
      fd.append("platform", platform);
      fd.append("label", label);
      fd.append("metrics", JSON.stringify(metrics));

      console.log("[analyze page] Calling /api/analyze...");
      const res = await fetch("/api/analyze", { method: "POST", body: fd });
      console.log("[analyze page] API response status:", res.status);

      const data = await res.json();
      console.log("[analyze page] API response keys:", Object.keys(data));
      console.log("[analyze page] analysis keys:", data.analysis ? Object.keys(data.analysis) : "MISSING");

      if (!res.ok) throw new Error(data.error ?? "Analysis failed");

      console.log("[analyze page] Storing to localStorage...");
      localStorage.setItem("analysisResult", JSON.stringify(data));
      console.log("[analyze page] localStorage set. Value length:", localStorage.getItem("analysisResult")?.length);
      console.log("[analyze page] Redirecting to /analyze/result...");
      // Use window.location.href for reliable navigation after localStorage write
      window.location.href = "/analyze/result";
    } catch (err) {
      console.error("[analyze page] Error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <Header title="Analyze Creative" subtitle="Upload an ad and enter its performance data" />
      <div className="mx-auto max-w-3xl p-6 space-y-6">

        {/* Upload */}
        <Card className="border-[#1E2530] bg-[#161B24]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white">Creative File</CardTitle>
          </CardHeader>
          <CardContent>
            <AdUpload
              onFileSelect={setFile}
              selectedFile={file}
              onClear={() => setFile(null)}
            />
          </CardContent>
        </Card>

        {/* Meta */}
        <Card className="border-[#1E2530] bg-[#161B24]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white">Creative Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#8693A8]">
                Creative Name
              </label>
              <Input
                placeholder="e.g. Pain Point Hook v2 — Meta"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-[#1E2530] bg-[#0F1117] text-white placeholder:text-[#5A6478] focus-visible:ring-[#FCD202]/30"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#8693A8]">Platform</label>
              <Select value={platform} onValueChange={(v) => { if (v) setPlatform(v); }}>
                <SelectTrigger className="border-[#1E2530] bg-[#0F1117] text-white focus:ring-[#FCD202]/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[#1E2530] bg-[#161B24]">
                  {["meta", "tiktok", "youtube", "google"].map((p) => (
                    <SelectItem key={p} value={p} className="capitalize text-white focus:bg-[#1E2530] focus:text-white">
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-[#8693A8]">Performance Label</label>
              <div className="flex gap-2">
                {labelOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setLabel(opt.value)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-md border py-2.5 text-sm font-medium transition-all ${
                      label === opt.value
                        ? opt.color
                        : "border-[#1E2530] bg-[#0F1117] text-[#5A6478] hover:border-[#2A3140] hover:text-[#8693A8]"
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics */}
        <Card className="border-[#1E2530] bg-[#161B24]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              {metricFields.map((field) => (
                <div key={field.key}>
                  <label className="mb-1.5 block text-xs font-medium text-[#8693A8]">
                    {field.label}
                  </label>
                  <div className="relative">
                    {field.prefix && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#5A6478]">
                        {field.prefix}
                      </span>
                    )}
                    <Input
                      type="number"
                      placeholder={field.placeholder}
                      value={metrics[field.key as keyof Metrics]}
                      onChange={(e) => handleMetric(field.key as keyof Metrics, e.target.value)}
                      className={`border-[#1E2530] bg-[#0F1117] text-white placeholder:text-[#5A6478] focus-visible:ring-[#FCD202]/30 ${
                        field.prefix ? "pl-6" : ""
                      } ${field.suffix ? "pr-6" : ""}`}
                    />
                    {field.suffix && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#5A6478]">
                        {field.suffix}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}

        {/* CTA */}
        <Button
          onClick={handleAnalyze}
          disabled={!file || isAnalyzing}
          className="w-full bg-[#FCD202] text-black font-semibold hover:bg-[#FCD202]/90 disabled:opacity-40 disabled:cursor-not-allowed h-11"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing with AI...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze Creative
            </>
          )}
        </Button>
      </div>
    </>
  );
}
