"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy, ArrowLeft, TrendingUp, Eye, MousePointer, Loader2,
  DollarSign, Sparkles, Users, BarChart3, Target, Zap, ChevronDown,
  ChevronUp, CheckCircle2, AlertTriangle, FileText, FlaskConical
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

// ─── Types ──────────────────────────────────────────────────────────────────

interface AnalysisContent {
  executiveSummary?: string;
  hookAnalysis?: { score: number; description: string; hookType: string; firstThreeSeconds: string };
  visualBreakdown?: Array<{ timeRange: string; description: string; elements: string[]; emotionalTone: string }>;
  elementDistribution?: Record<string, number>;
  emotionalArc?: Array<{ timestamp: string; emotion: string; intensity: number }>;
  strategyAnalysis?: { whyItWorked: string[]; successFactors: string[]; psychologyPrinciples: string[]; improvements: string[] };
  audienceAnalysis?: { primaryPersona: { name: string; age: string; description: string; painPoints: string[]; desires: string[] }; targetDemographics: string };
  growthRecommendations?: { abTests: Array<{ name: string; hypothesis: string; variable: string; expectedImpact: string }>; scalingStrategy: string };
  buildingBlocks?: { hooks: Array<{ text: string; type: string }>; angles: Array<{ name: string; epicType: string }>; benefits: string[]; socialProof: string[]; ctas: string[] };
  adFormat?: { duration: string; format: string; style: string; platform: string };
}

interface Ad {
  id: string;
  title: string;
  file_url: string;
  file_type: string;
  platform: string;
  label: string;
  status: string;
  metrics: Record<string, number>;
  created_at: string;
}

interface Analysis {
  id: string;
  content: AnalysisContent;
  model_used: string;
  created_at: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const labelColors: Record<string, string> = {
  winner: "bg-[#FCD202]/15 text-[#FCD202] border-[#FCD202]/20",
  loser: "bg-red-500/15 text-red-400 border-red-500/20",
  neutral: "bg-[#2A3140] text-[#8693A8] border-[#1E2530]",
};

const PIE_COLORS = ["#FCD202", "#3B82F6", "#8B5CF6", "#10B981", "#F97316"];

function HookGauge({ score }: { score: number }) {
  const radius = 45;
  const circumference = Math.PI * radius; // half circle
  const offset = circumference - (score / 10) * circumference;
  const color = score >= 7 ? "#FCD202" : score >= 5 ? "#F97316" : "#EF4444";

  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="70" viewBox="0 0 120 70">
        <path
          d={`M 15 60 A ${radius} ${radius} 0 0 1 105 60`}
          fill="none" stroke="#1E2530" strokeWidth="10" strokeLinecap="round"
        />
        <path
          d={`M 15 60 A ${radius} ${radius} 0 0 1 105 60`}
          fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
        <text x="60" y="58" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
          {score}
        </text>
        <text x="60" y="70" textAnchor="middle" fill="#5A6478" fontSize="9">
          out of 10
        </text>
      </svg>
    </div>
  );
}

// ─── Script Generator ────────────────────────────────────────────────────────

function ScriptGenerator({ analysisId }: { analysisId: string }) {
  const [platform, setPlatform] = useState("meta");
  const [generating, setGenerating] = useState(false);
  const [script, setScript] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const generate = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId, platform }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setScript(data.script.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate script");
    } finally {
      setGenerating(false);
    }
  };

  const sections = script ? [
    { key: "hook", label: "Hook", color: "text-[#FCD202]" },
    { key: "problem", label: "Problem / Agitation", color: "text-orange-400" },
    { key: "solution", label: "Solution", color: "text-blue-400" },
    { key: "proof", label: "Proof / Results", color: "text-green-400" },
    { key: "cta", label: "Call to Action", color: "text-purple-400" },
  ] : [];

  return (
    <div className="space-y-4">
      {!script ? (
        <div className="flex items-center gap-3">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="rounded-md border border-[#1E2530] bg-[#0F1117] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#FCD202]/30"
          >
            {["meta", "tiktok", "youtube", "google"].map((p) => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
          <Button
            onClick={generate}
            disabled={generating}
            className="bg-[#FCD202] text-black font-semibold hover:bg-[#FCD202]/90"
          >
            {generating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" />Generate Script</>
            )}
          </Button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">{String(script.title)}</h3>
              <p className="text-xs text-[#5A6478]">{String(script.platform)} · {String(script.duration)}</p>
            </div>
            <Button
              onClick={() => setScript(null)}
              variant="outline"
              className="border-[#1E2530] text-[#8693A8] hover:bg-[#1E2530] hover:text-white text-xs h-8"
            >
              Generate New
            </Button>
          </div>

          {sections.map(({ key, label, color }) => {
            const section = script[key] as Record<string, string> | undefined;
            if (!section) return null;
            return (
              <Card key={key} className="border-[#1E2530] bg-[#0F1117]">
                <button
                  className="w-full flex items-center justify-between p-4"
                  onClick={() => setExpanded(e => ({ ...e, [key]: !e[key] }))}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold uppercase tracking-wider ${color}`}>{label}</span>
                    <span className="text-xs text-[#5A6478]">{section.duration}</span>
                  </div>
                  {expanded[key] ? <ChevronUp className="h-4 w-4 text-[#5A6478]" /> : <ChevronDown className="h-4 w-4 text-[#5A6478]" />}
                </button>
                {expanded[key] && (
                  <div className="px-4 pb-4 space-y-2 border-t border-[#1E2530] pt-3">
                    <div>
                      <p className="text-xs font-medium text-[#5A6478] mb-1">Voiceover</p>
                      <p className="text-sm text-white">{section.text}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#5A6478] mb-1">Visual Direction</p>
                      <p className="text-sm text-[#8693A8]">{section.visual}</p>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}

          {typeof script.targetAngle === "string" && script.targetAngle && (
            <div className="rounded-lg bg-[#FCD202]/5 border border-[#FCD202]/20 p-3">
              <p className="text-xs font-medium text-[#FCD202] mb-1">Target Angle</p>
              <p className="text-sm text-white">{script.targetAngle}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalysisDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [ad, setAd] = useState<Ad | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const supabase = createClient();
      const { data: adData, error: adErr } = await supabase
        .from("ads")
        .select("*")
        .eq("id", id)
        .single();

      if (adErr || !adData) throw new Error("Ad not found");
      setAd(adData);

      const { data: analyses, error: analysisErr } = await supabase
        .from("ad_analyses")
        .select("*")
        .eq("ad_id", id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!analysisErr && analyses && analyses.length > 0) {
        setAnalysis(analyses[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <Header title="Analysis Detail" subtitle="Loading..." />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#FCD202]" />
        </div>
      </>
    );
  }

  if (error || !ad) {
    return (
      <>
        <Header title="Analysis Detail" subtitle="Error" />
        <div className="p-6">
          <p className="text-red-400">{error || "Ad not found"}</p>
          <Link href="/analyze" className="text-[#FCD202] hover:underline text-sm mt-2 block">
            ← Back to Analyze
          </Link>
        </div>
      </>
    );
  }

  const content: AnalysisContent = analysis?.content || {};
  const isVideo = ad.file_type === "video";

  // Prepare chart data
  const elementData = content.elementDistribution
    ? Object.entries(content.elementDistribution).map(([name, value]) => ({
        name: name.replace(/([A-Z])/g, " $1").trim(),
        value: Math.round(value),
      })).filter(d => d.value > 0)
    : [];

  const emotionalArcData = (content.emotionalArc || []).map(p => ({
    time: p.timestamp,
    intensity: p.intensity,
    emotion: p.emotion,
  }));

  const metricCards = [
    { label: "ROAS", value: ad.metrics?.roas ? `${ad.metrics.roas}x` : "—", icon: TrendingUp },
    { label: "Hook Rate", value: ad.metrics?.hookRate ? `${ad.metrics.hookRate}%` : "—", icon: Eye },
    { label: "CTR", value: ad.metrics?.ctr ? `${ad.metrics.ctr}%` : "—", icon: MousePointer },
    { label: "Spend", value: ad.metrics?.spend ? `$${ad.metrics.spend.toLocaleString()}` : "—", icon: DollarSign },
  ];

  return (
    <>
      <Header title="Analysis Detail" subtitle={`${ad.platform} · ${content.adFormat?.format || "Ad"}`} />
      <div className="p-6 space-y-6">
        <Link
          href="/analyze"
          className="flex items-center gap-2 text-sm text-[#8693A8] hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Analyze
        </Link>

        {/* Hero Section */}
        <div className="flex items-start gap-6">
          <div className="h-40 w-64 rounded-xl bg-[#161B24] border border-[#1E2530] flex-shrink-0 overflow-hidden">
            {isVideo ? (
              <video
                src={ad.file_url}
                className="h-full w-full object-cover"
                controls
                preload="metadata"
              />
            ) : ad.file_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ad.file_url} alt={ad.title} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full flex items-center justify-center">
                <span className="text-[#5A6478] text-sm">Preview</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h2 className="text-xl font-bold text-white">{ad.title}</h2>
              <Badge className={`border capitalize flex items-center gap-1 ${labelColors[ad.label]}`}>
                {ad.label === "winner" && <Trophy className="h-3 w-3" />}
                {ad.label}
              </Badge>
              {analysis && (
                <Badge className="border border-[#1E2530] bg-transparent text-[#5A6478] text-[10px]">
                  {analysis.model_used}
                </Badge>
              )}
            </div>
            <p className="text-sm text-[#5A6478] mb-4 capitalize">
              {ad.platform} · {content.adFormat?.duration || "—"} · {content.adFormat?.style || "—"}
            </p>
            <div className="grid grid-cols-4 gap-3">
              {metricCards.map((m) => (
                <div key={m.label} className="rounded-lg bg-[#161B24] border border-[#1E2530] p-3">
                  <p className="text-xs text-[#5A6478]">{m.label}</p>
                  <p className="mt-1 text-lg font-bold text-white">{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* No analysis yet */}
        {!analysis && (
          <Card className="border-[#FCD202]/20 bg-[#FCD202]/5">
            <CardContent className="p-5 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-[#FCD202] flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#FCD202]">Analysis not yet available</p>
                <p className="text-xs text-[#8693A8] mt-0.5">
                  The AI analysis is still processing or has not been triggered yet.
                  {ad.status === "failed" && " Analysis failed — please re-upload."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="dashboard">
          <TabsList className="bg-[#161B24] border border-[#1E2530] flex-wrap h-auto gap-1 p-1">
            {[
              { value: "dashboard", label: "Dashboard", icon: BarChart3 },
              { value: "analysis", label: "Ad Analysis", icon: Eye },
              { value: "strategy", label: "Strategy", icon: Target },
              { value: "audience", label: "Audience", icon: Users },
              { value: "growth", label: "Growth", icon: TrendingUp },
              { value: "blocks", label: "Building Blocks", icon: Zap },
              { value: "scripts", label: "Scripts", icon: FileText },
            ].map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex items-center gap-1.5 text-[#8693A8] data-[state=active]:bg-[#FCD202] data-[state=active]:text-black text-xs"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── DASHBOARD TAB ─────────────────────────────────────────────── */}
          <TabsContent value="dashboard" className="mt-4 space-y-4">
            {/* Executive Summary */}
            {content.executiveSummary && (
              <Card className="border-[#1E2530] bg-[#161B24]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#FCD202]" />
                    Executive Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[#8693A8] leading-relaxed">{content.executiveSummary}</p>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Hook Strength Gauge */}
              {content.hookAnalysis && (
                <Card className="border-[#1E2530] bg-[#161B24]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-white">Hook Strength</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <HookGauge score={content.hookAnalysis.score} />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className="border border-[#1E2530] bg-transparent text-[#8693A8] text-[10px]">
                          {content.hookAnalysis.hookType}
                        </Badge>
                      </div>
                      <p className="text-xs text-[#8693A8]">{content.hookAnalysis.firstThreeSeconds}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Element Distribution Donut */}
              {elementData.length > 0 && (
                <Card className="border-[#1E2530] bg-[#161B24]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-white">Element Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={elementData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {elementData.map((_, index) => (
                            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "#161B24", border: "1px solid #1E2530", borderRadius: "8px", color: "#fff" }}
                          formatter={(val) => [`${val}%`, ""]}
                        />
                        <Legend
                          iconSize={8}
                          formatter={(val) => <span style={{ color: "#8693A8", fontSize: "11px" }}>{val}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Ad Format Details */}
            {content.adFormat && (
              <Card className="border-[#1E2530] bg-[#161B24]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-white">Ad Format</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(content.adFormat).map(([k, v]) => (
                      <div key={k} className="rounded-md bg-[#1E2530] px-3 py-1.5">
                        <span className="text-[10px] text-[#5A6478] uppercase tracking-wider">{k}</span>
                        <p className="text-xs font-medium text-white mt-0.5">{v}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── AD ANALYSIS TAB ───────────────────────────────────────────── */}
          <TabsContent value="analysis" className="mt-4 space-y-4">
            {/* Hook Analysis Detail */}
            {content.hookAnalysis && (
              <Card className="border-[#1E2530] bg-[#161B24]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-white">Hook Analysis</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 rounded-full bg-[#1E2530]">
                        <div
                          className="h-full rounded-full bg-[#FCD202]"
                          style={{ width: `${content.hookAnalysis.score * 10}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-white">{content.hookAnalysis.score}/10</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-[#8693A8]">{content.hookAnalysis.description}</p>
                  <div className="flex gap-2">
                    <Badge className="border border-[#FCD202]/20 bg-[#FCD202]/10 text-[#FCD202] text-[10px]">
                      {content.hookAnalysis.hookType}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Visual Breakdown Table */}
            {content.visualBreakdown && content.visualBreakdown.length > 0 && (
              <Card className="border-[#1E2530] bg-[#161B24]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-white">Visual Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-md border border-[#1E2530]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#1E2530] bg-[#0F1117]">
                          {["Time", "What's Shown", "Emotional Tone", "Elements"].map(h => (
                            <th key={h} className="px-3 py-2 text-left text-xs font-medium text-[#5A6478]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {content.visualBreakdown.map((row, i) => (
                          <tr key={i} className="border-b border-[#1E2530] last:border-0 hover:bg-[#1E2530]/30">
                            <td className="px-3 py-2.5 font-mono text-xs text-[#FCD202] whitespace-nowrap">{row.timeRange}</td>
                            <td className="px-3 py-2.5 text-xs text-white">{row.description}</td>
                            <td className="px-3 py-2.5">
                              <span className="text-xs text-[#8693A8] capitalize">{row.emotionalTone}</span>
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="flex flex-wrap gap-1">
                                {(row.elements || []).map((el, j) => (
                                  <span key={j} className="text-[10px] rounded bg-[#1E2530] px-1.5 py-0.5 text-[#8693A8]">{el}</span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Emotional Arc Chart */}
            {emotionalArcData.length > 0 && (
              <Card className="border-[#1E2530] bg-[#161B24]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-white">Emotional Arc</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={emotionalArcData}>
                      <XAxis dataKey="time" tick={{ fill: "#5A6478", fontSize: 11 }} />
                      <YAxis domain={[0, 10]} tick={{ fill: "#5A6478", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#161B24", border: "1px solid #1E2530", borderRadius: "8px" }}
                        labelStyle={{ color: "#fff" }}
                        formatter={(val, _, props) => [
                          `Intensity: ${val}`,
                          props.payload?.emotion,
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="intensity"
                        stroke="#FCD202"
                        strokeWidth={2}
                        dot={{ fill: "#FCD202", r: 4 }}
                        activeDot={{ r: 6, fill: "#FCD202" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── STRATEGY TAB ──────────────────────────────────────────────── */}
          <TabsContent value="strategy" className="mt-4 space-y-4">
            {content.strategyAnalysis ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-[#1E2530] bg-[#161B24]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                        Why It Worked
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {(content.strategyAnalysis.whyItWorked || []).map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-[#8693A8]">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-400 flex-shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-[#1E2530] bg-[#161B24]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-[#FCD202]" />
                        Improvements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {(content.strategyAnalysis.improvements || []).map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-[#8693A8]">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#FCD202] flex-shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-[#1E2530] bg-[#161B24]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-white">Psychology Principles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {(content.strategyAnalysis.psychologyPrinciples || []).map((p, i) => (
                        <Badge key={i} className="border border-purple-500/20 bg-purple-500/10 text-purple-400 capitalize">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-[#1E2530] bg-[#161B24]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-white">Success Factors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {(content.strategyAnalysis.successFactors || []).map((f, i) => (
                        <div key={i} className="flex items-start gap-2 rounded-md bg-[#0F1117] p-3">
                          <span className="text-[#FCD202] text-sm font-bold">{i + 1}</span>
                          <p className="text-sm text-[#8693A8]">{f}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <EmptyState message="Strategy analysis not available" />
            )}
          </TabsContent>

          {/* ── AUDIENCE TAB ──────────────────────────────────────────────── */}
          <TabsContent value="audience" className="mt-4 space-y-4">
            {content.audienceAnalysis ? (
              <>
                <Card className="border-[#1E2530] bg-[#161B24] overflow-hidden">
                  <div className="bg-gradient-to-r from-[#FCD202]/20 to-purple-500/20 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-white text-lg">
                          {content.audienceAnalysis.primaryPersona.name}
                        </h3>
                        <p className="text-sm text-[#8693A8] mt-0.5">
                          Age: {content.audienceAnalysis.primaryPersona.age}
                        </p>
                      </div>
                      <div className="rounded-full bg-[#FCD202]/20 p-3">
                        <Users className="h-6 w-6 text-[#FCD202]" />
                      </div>
                    </div>
                    <p className="text-sm text-[#E2E8F0] mt-3">
                      {content.audienceAnalysis.primaryPersona.description}
                    </p>
                  </div>
                  <CardContent className="p-5 space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-[#5A6478] uppercase tracking-wider mb-2">Pain Points</p>
                      <div className="flex flex-wrap gap-2">
                        {(content.audienceAnalysis.primaryPersona.painPoints || []).map((p, i) => (
                          <Badge key={i} className="border border-red-500/20 bg-red-500/10 text-red-400">{p}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#5A6478] uppercase tracking-wider mb-2">Desires</p>
                      <div className="flex flex-wrap gap-2">
                        {(content.audienceAnalysis.primaryPersona.desires || []).map((d, i) => (
                          <Badge key={i} className="border border-green-500/20 bg-green-500/10 text-green-400">{d}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#5A6478] uppercase tracking-wider mb-2">Demographics</p>
                      <p className="text-sm text-[#8693A8]">{content.audienceAnalysis.targetDemographics}</p>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <EmptyState message="Audience analysis not available" />
            )}
          </TabsContent>

          {/* ── GROWTH TAB ────────────────────────────────────────────────── */}
          <TabsContent value="growth" className="mt-4 space-y-4">
            {content.growthRecommendations ? (
              <>
                <Card className="border-[#1E2530] bg-[#161B24]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                      Scaling Strategy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[#8693A8]">{content.growthRecommendations.scalingStrategy}</p>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-[#FCD202]" />
                    A/B Test Roadmap
                  </h3>
                  {(content.growthRecommendations.abTests || []).map((test, i) => (
                    <Card key={i} className="border-[#1E2530] bg-[#161B24]">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold text-white text-sm">{test.name}</h4>
                          <Badge className="border border-green-500/20 bg-green-500/10 text-green-400 text-[10px] whitespace-nowrap ml-2">
                            {test.expectedImpact}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div>
                            <span className="text-[10px] font-medium text-[#5A6478] uppercase tracking-wider">Variable</span>
                            <p className="text-xs text-[#E2E8F0]">{test.variable}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-medium text-[#5A6478] uppercase tracking-wider">Hypothesis</span>
                            <p className="text-xs text-[#8693A8]">{test.hypothesis}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState message="Growth recommendations not available" />
            )}
          </TabsContent>

          {/* ── BUILDING BLOCKS TAB ───────────────────────────────────────── */}
          <TabsContent value="blocks" className="mt-4 space-y-4">
            {content.buildingBlocks ? (
              <>
                {[
                  { key: "hooks", label: "Hooks", color: "text-[#FCD202]", bg: "bg-[#FCD202]/10", border: "border-[#FCD202]/20" },
                  { key: "angles", label: "Angles", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
                  { key: "benefits", label: "Benefits", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
                  { key: "socialProof", label: "Social Proof", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
                  { key: "ctas", label: "CTAs", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
                ].map(({ key, label, color, bg, border }) => {
                  const items = content.buildingBlocks![key as keyof typeof content.buildingBlocks] as Array<unknown>;
                  if (!items || items.length === 0) return null;
                  return (
                    <Card key={key} className="border-[#1E2530] bg-[#161B24]">
                      <CardHeader className="pb-3">
                        <CardTitle className={`text-sm font-semibold ${color}`}>{label}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {items.map((item, i) => {
                            const text = typeof item === "string" ? item : (item as { text?: string; name?: string }).text || (item as { name?: string }).name || "";
                            const subLabel = typeof item === "object" && item !== null
                              ? (item as { type?: string; epicType?: string }).type || (item as { epicType?: string }).epicType
                              : undefined;
                            return (
                              <div key={i} className={`rounded-md border ${border} ${bg} px-3 py-2`}>
                                <p className={`text-sm font-medium ${color}`}>{text}</p>
                                {subLabel && <p className="text-[10px] text-[#5A6478] mt-0.5">{subLabel}</p>}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </>
            ) : (
              <EmptyState message="Building blocks not available" />
            )}
          </TabsContent>

          {/* ── SCRIPTS TAB ───────────────────────────────────────────────── */}
          <TabsContent value="scripts" className="mt-4">
            <Card className="border-[#1E2530] bg-[#161B24]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#FCD202]" />
                  Script Generator
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysis ? (
                  <ScriptGenerator analysisId={analysis.id} />
                ) : (
                  <p className="text-sm text-[#5A6478]">
                    Complete the AI analysis first to generate scripts.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="border-[#1E2530] bg-[#161B24]">
      <CardContent className="p-8 flex flex-col items-center justify-center text-center">
        <AlertTriangle className="h-8 w-8 text-[#2A3140] mb-3" />
        <p className="text-sm text-[#5A6478]">{message}</p>
      </CardContent>
    </Card>
  );
}
