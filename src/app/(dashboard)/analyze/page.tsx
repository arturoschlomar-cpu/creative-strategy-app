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
import { Loader2, Sparkles, Trophy, Minus, TrendingDown, CheckCircle2, AlertCircle } from "lucide-react";
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

type UploadStep = "idle" | "uploading" | "saving" | "analyzing" | "done" | "error";

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

const stepLabels: Record<UploadStep, string> = {
  idle: "",
  uploading: "Uploading to storage...",
  saving: "Saving ad record...",
  analyzing: "Analyzing with Gemini AI... (this may take 30–60s for videos)",
  done: "Analysis complete!",
  error: "Something went wrong",
};

export default function AnalyzePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState<Label>("neutral");
  const [platform, setPlatform] = useState<string>("meta");
  const [title, setTitle] = useState("");
  const [metrics, setMetrics] = useState<Metrics>({
    hookRate: "", holdRate: "", ctr: "", cvr: "", cpa: "", roas: "", spend: "",
  });
  const [step, setStep] = useState<UploadStep>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const handleMetric = (key: keyof Metrics, value: string) => {
    setMetrics((m) => ({ ...m, [key]: value }));
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setStep("uploading");
    setUploadProgress(0);
    setErrorMsg("");

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate a unique ad ID
      const adId = crypto.randomUUID();
      const ext = file.name.split(".").pop() || "mp4";
      const storagePath = `${user.id}/${adId}.${ext}`;

      // Simulate upload progress while uploading
      const progressInterval = setInterval(() => {
        setUploadProgress((p) => Math.min(p + 10, 85));
      }, 300);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("ads")
        .upload(storagePath, file, { upsert: false });

      clearInterval(progressInterval);

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
      setUploadProgress(100);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("ads")
        .getPublicUrl(storagePath);

      setStep("saving");

      // Save ad record
      const metricsObj: Record<string, number> = {};
      for (const [key, val] of Object.entries(metrics)) {
        if (val) metricsObj[key] = parseFloat(val);
      }

      const { error: dbError } = await supabase.from("ads").insert({
        id: adId,
        user_id: user.id,
        title: title || file.name.replace(/\.[^.]+$/, ""),
        file_url: publicUrl,
        file_type: file.type.startsWith("video/") ? "video" : "image",
        file_path: storagePath,
        platform,
        label,
        status: "pending",
        metrics: metricsObj,
      });

      if (dbError) throw new Error(`Failed to save ad: ${dbError.message}`);

      setStep("analyzing");

      // Call the analysis API
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId }),
      });

      if (!analyzeRes.ok) {
        const err = await analyzeRes.json();
        throw new Error(err.error || "Analysis failed");
      }

      setStep("done");

      // Redirect to analysis page
      setTimeout(() => router.push(`/analyze/${adId}`), 800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setErrorMsg(msg);
      setStep("error");
    }
  };

  const isLoading = step === "uploading" || step === "saving" || step === "analyzing";
  const isDone = step === "done";

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
            <CardTitle className="text-sm font-semibold text-white">Performance Metrics <span className="text-[#5A6478] font-normal">(optional)</span></CardTitle>
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

        {/* Progress */}
        {step !== "idle" && (
          <Card className={`border ${
            step === "error" ? "border-red-500/30 bg-red-500/5" :
            step === "done" ? "border-green-500/30 bg-green-500/5" :
            "border-[#FCD202]/20 bg-[#FCD202]/5"
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {step === "error" ? (
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                ) : step === "done" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                ) : (
                  <Loader2 className="h-5 w-5 text-[#FCD202] animate-spin flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    step === "error" ? "text-red-400" :
                    step === "done" ? "text-green-400" :
                    "text-[#FCD202]"
                  }`}>
                    {stepLabels[step]}
                  </p>
                  {step === "error" && (
                    <p className="text-xs text-red-400/70 mt-0.5 truncate">{errorMsg}</p>
                  )}
                  {step === "uploading" && (
                    <div className="mt-2 h-1 w-full rounded-full bg-[#1E2530]">
                      <div
                        className="h-full rounded-full bg-[#FCD202] transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA */}
        <div className="flex gap-3">
          <Button
            onClick={handleAnalyze}
            disabled={!file || isLoading || isDone}
            className="flex-1 bg-[#FCD202] text-black font-semibold hover:bg-[#FCD202]/90 disabled:opacity-40 disabled:cursor-not-allowed h-11"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {step === "uploading" ? `Uploading ${uploadProgress}%` :
                 step === "saving" ? "Saving..." : "Analyzing..."}
              </>
            ) : isDone ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Redirecting...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze Creative
              </>
            )}
          </Button>
          {step === "error" && (
            <Button
              onClick={() => setStep("idle")}
              variant="outline"
              className="border-[#1E2530] text-[#8693A8] hover:bg-[#1E2530] hover:text-white h-11"
            >
              Try Again
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
