"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Loader2, Sparkles, Trophy, Minus, TrendingDown, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
  const router = useRouter();
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
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleMetric = (key: keyof Metrics, value: string) => {
    setMetrics((m) => ({ ...m, [key]: value }));
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setError(null);
    setStatusMessage("Uploading your creative...");

    try {
      const supabase = createClient();

      // Check user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("You must be signed in to analyze ads. Please refresh and sign in again.");
      }

      // Upload file directly to Supabase Storage from the browser
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: storageError } = await supabase.storage
        .from("ads")
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false,
        });

      if (storageError) {
        console.error("Storage upload error:", storageError);
        throw new Error(`File upload failed: ${storageError.message}. Make sure the "ads" storage bucket exists in Supabase with public access.`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from("ads").getPublicUrl(fileName);
      const fileUrl = urlData.publicUrl;

      console.log("File uploaded, URL:", fileUrl);
      setStatusMessage("Analyzing with AI... This may take up to 2 minutes for videos.");

      // Build metrics object (only non-empty values)
      const filteredMetrics = Object.fromEntries(
        Object.entries(metrics).filter(([, v]) => v !== "")
      );

      // Call the analyze API with the file URL
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl,
          mimeType: file.type,
          title,
          platform,
          label,
          metrics: filteredMetrics,
        }),
      });

      const data = await response.json();
      console.log("API response:", data);

      if (!response.ok) {
        throw new Error(data.error || `Analysis failed (status ${response.status})`);
      }

      if (data.warning) {
        console.warn("Analysis warning:", data.warning);
      }

      if (data.id) {
        // Redirect to detail page
        router.push(`/analyze/${data.id}`);
      } else {
        // Analysis succeeded but wasn't saved to DB — show inline warning
        setError(data.warning || "Analysis complete but could not be saved. Check database permissions.");
        setIsAnalyzing(false);
        setStatusMessage("");
      }
    } catch (err) {
      console.error("handleAnalyze error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setIsAnalyzing(false);
      setStatusMessage("");
    }
  };

  return (
    <>
      <Header title="Analyze Creative" subtitle="Upload an ad and get AI-powered creative analysis" />
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
                Creative Name <span className="text-[#5A6478]">(optional)</span>
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
              <label className="mb-2 block text-xs font-medium text-[#8693A8]">
                Performance Label <span className="text-[#5A6478]">(optional — defaults to Neutral)</span>
              </label>
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

        {/* Metrics — all optional */}
        <Card className="border-[#1E2530] bg-[#161B24]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white">
              Performance Metrics{" "}
              <span className="text-xs font-normal text-[#5A6478]">— all optional</span>
            </CardTitle>
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

        {/* Error display */}
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
            <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
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
              {statusMessage || "Analyzing your ad... This may take up to 2 minutes"}
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
