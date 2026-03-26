"use client";

import { useState, useRef, DragEvent } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
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
import {
  Loader2,
  Sparkles,
  Trophy,
  Minus,
  TrendingDown,
  Upload,
  X,
  FileVideo,
  FileImage,
} from "lucide-react";

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

const labelOptions: {
  value: Label;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
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

  const handleFile = (f: File) => {
    setFile(f);
    setError(null);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  const handleMetric = (key: keyof Metrics, value: string) => {
    setMetrics((m) => ({ ...m, [key]: value }));
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      // Store result in localStorage, then navigate to result page
      localStorage.setItem(
        "analyzeResult",
        JSON.stringify({
          ...data,
          title: title || file.name,
          label,
          platform,
          metrics,
        })
      );

      router.push("/analyze/result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <Header
        title="Analyze Creative"
        subtitle="Upload an ad and enter its performance data"
      />
      <div className="mx-auto max-w-3xl p-6 space-y-6">
        {/* Upload Drop Zone */}
        <Card className="border-[#1E2530] bg-[#161B24]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white">
              Creative File
            </CardTitle>
          </CardHeader>
          <CardContent>
            {file ? (
              <div className="flex items-center gap-3 rounded-lg border border-[#2A3140] bg-[#0F1117] p-4">
                {file.type.startsWith("video/") ? (
                  <FileVideo className="h-8 w-8 text-[#FCD202] flex-shrink-0" />
                ) : (
                  <FileImage className="h-8 w-8 text-[#FCD202] flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-[#5A6478]">
                    {(file.size / 1024 / 1024).toFixed(2)} MB · {file.type}
                  </p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="text-[#5A6478] hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 cursor-pointer transition-colors ${
                  isDragging
                    ? "border-[#FCD202] bg-[#FCD202]/5"
                    : "border-[#2A3140] hover:border-[#FCD202]/40 hover:bg-[#FCD202]/5"
                }`}
              >
                <Upload className="h-8 w-8 text-[#5A6478]" />
                <div className="text-center">
                  <p className="text-sm font-medium text-white">
                    Drop your file here, or click to browse
                  </p>
                  <p className="text-xs text-[#5A6478] mt-1">
                    Images and videos up to 20MB
                  </p>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </CardContent>
        </Card>

        {/* Creative Details */}
        <Card className="border-[#1E2530] bg-[#161B24]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white">
              Creative Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#8693A8]">
                Creative Name{" "}
                <span className="text-[#5A6478]">(optional)</span>
              </label>
              <Input
                placeholder="e.g. Pain Point Hook v2 — Meta"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-[#1E2530] bg-[#0F1117] text-white placeholder:text-[#5A6478] focus-visible:ring-[#FCD202]/30"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#8693A8]">
                Platform
              </label>
              <Select
                value={platform}
                onValueChange={(v) => {
                  if (v) setPlatform(v);
                }}
              >
                <SelectTrigger className="border-[#1E2530] bg-[#0F1117] text-white focus:ring-[#FCD202]/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[#1E2530] bg-[#161B24]">
                  {["meta", "tiktok", "youtube", "google"].map((p) => (
                    <SelectItem
                      key={p}
                      value={p}
                      className="capitalize text-white focus:bg-[#1E2530] focus:text-white"
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-[#8693A8]">
                Performance Label{" "}
                <span className="text-[#5A6478]">(optional)</span>
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

        {/* Metrics */}
        <Card className="border-[#1E2530] bg-[#161B24]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white">
              Performance Metrics{" "}
              <span className="text-[#5A6478] font-normal">(optional)</span>
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
                      onChange={(e) =>
                        handleMetric(field.key as keyof Metrics, e.target.value)
                      }
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
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
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
              Analyzing... this may take up to 2 minutes
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
