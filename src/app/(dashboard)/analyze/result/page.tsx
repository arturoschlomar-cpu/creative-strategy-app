"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Trophy,
  Minus,
  TrendingDown,
  Zap,
  Target,
  Lightbulb,
  FlaskConical,
} from "lucide-react";

interface Analysis {
  executiveSummary?: string;
  hookScore?: number;
  hookAnalysis?: string;
  format?: string;
  duration?: string;
  visualBreakdown?: { time: string; description: string; elements: string[] }[];
  emotionalArc?: { time: string; emotion: string; intensity: number }[];
  strengths?: string[];
  weaknesses?: string[];
  psychologyPrinciples?: string[];
  targetAudience?: { age?: string; gender?: string; interests?: string[] };
  buildingBlocks?: {
    hooks?: string[];
    angles?: string[];
    ctas?: string[];
    socialProof?: string[];
  };
  improvements?: string[];
  abTestIdeas?: { name: string; hypothesis: string; expectedImpact: string }[];
}

interface ResultData {
  id: string;
  analysis: Analysis;
  fileName: string;
  fileType: string;
  title?: string;
  label?: "winner" | "loser" | "neutral";
  platform?: string;
  metrics?: Record<string, string>;
}

const labelConfig = {
  winner: {
    icon: <Trophy className="h-3 w-3" />,
    label: "Winner",
    className: "bg-[#FCD202]/15 text-[#FCD202] border-[#FCD202]/20",
  },
  neutral: {
    icon: <Minus className="h-3 w-3" />,
    label: "Neutral",
    className: "bg-[#1E2530] text-[#8693A8] border-[#2A3140]",
  },
  loser: {
    icon: <TrendingDown className="h-3 w-3" />,
    label: "Loser",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
  },
};

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, (score / 10) * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 rounded-full bg-[#1E2530]">
        <div
          className="h-full rounded-full bg-[#FCD202] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-bold text-white">{score}/10</span>
    </div>
  );
}

export default function AnalyzeResultPage() {
  const router = useRouter();
  const [data, setData] = useState<ResultData | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("analyzeResult");
    if (!raw) {
      router.push("/analyze");
      return;
    }
    try {
      setData(JSON.parse(raw));
    } catch {
      router.push("/analyze");
    }
  }, [router]);

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#FCD202] border-t-transparent" />
      </div>
    );
  }

  const { analysis, title, fileName, label = "neutral", platform } = data;
  const lc = labelConfig[label];

  return (
    <>
      <Header
        title="Analysis Results"
        subtitle={title || fileName}
      />
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <Link
          href="/analyze"
          className="flex items-center gap-2 text-sm text-[#8693A8] hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Analyze Another
        </Link>

        {/* Hero */}
        <Card className="border-[#1E2530] bg-[#161B24]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-lg font-bold text-white">
                    {title || fileName}
                  </h2>
                  <Badge
                    className={`flex items-center gap-1 border ${lc.className}`}
                  >
                    {lc.icon}
                    {lc.label}
                  </Badge>
                </div>
                <p className="text-sm text-[#5A6478]">
                  {platform && (
                    <span className="capitalize">{platform} · </span>
                  )}
                  {analysis.format && <span>{analysis.format} · </span>}
                  {analysis.duration && <span>{analysis.duration}</span>}
                </p>
              </div>
              {analysis.hookScore !== undefined && (
                <div className="text-right">
                  <p className="text-xs text-[#5A6478] mb-1">Hook Score</p>
                  <ScoreBar score={analysis.hookScore} />
                </div>
              )}
            </div>
            {analysis.executiveSummary && (
              <p className="text-sm text-[#8693A8] leading-relaxed">
                {analysis.executiveSummary}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="analysis">
          <TabsList className="bg-[#161B24] border border-[#1E2530]">
            {[
              { value: "analysis", label: "Analysis" },
              { value: "building-blocks", label: "Building Blocks" },
              { value: "audience", label: "Audience" },
              { value: "recommendations", label: "Recommendations" },
            ].map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="text-[#8693A8] data-[state=active]:bg-[#FCD202] data-[state=active]:text-black"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="mt-4 space-y-4">
            {analysis.hookAnalysis && (
              <Card className="border-[#1E2530] bg-[#161B24]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                      <Zap className="h-4 w-4 text-[#FCD202]" />
                      Hook Analysis
                    </CardTitle>
                    {analysis.hookScore !== undefined && (
                      <ScoreBar score={analysis.hookScore} />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[#8693A8]">
                    {analysis.hookAnalysis}
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-4">
              {analysis.strengths && analysis.strengths.length > 0 && (
                <Card className="border-[#1E2530] bg-[#161B24]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-white">
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#8693A8]">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-400 flex-shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {analysis.weaknesses && analysis.weaknesses.length > 0 && (
                <Card className="border-[#1E2530] bg-[#161B24]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-white">
                      Weaknesses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.weaknesses.map((w, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#8693A8]">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400 flex-shrink-0" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            {analysis.psychologyPrinciples && analysis.psychologyPrinciples.length > 0 && (
              <Card className="border-[#1E2530] bg-[#161B24]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-white">
                    Psychology Principles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.psychologyPrinciples.map((p, i) => (
                      <span
                        key={i}
                        className="rounded-md border border-[#2A3140] bg-[#1E2530] px-3 py-1 text-xs text-[#8693A8]"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {analysis.visualBreakdown && analysis.visualBreakdown.length > 0 && (
              <Card className="border-[#1E2530] bg-[#161B24]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-white">
                    Visual Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.visualBreakdown.map((v, i) => (
                      <div key={i} className="flex gap-3">
                        <span className="flex-shrink-0 rounded bg-[#1E2530] px-2 py-0.5 text-xs font-mono text-[#FCD202]">
                          {v.time}
                        </span>
                        <div>
                          <p className="text-sm text-[#8693A8]">{v.description}</p>
                          {v.elements && v.elements.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {v.elements.map((el, j) => (
                                <span key={j} className="text-xs text-[#5A6478]">
                                  {el}
                                  {j < v.elements.length - 1 ? " · " : ""}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Building Blocks Tab */}
          <TabsContent value="building-blocks" className="mt-4 space-y-4">
            {analysis.buildingBlocks && (
              <>
                {analysis.buildingBlocks.hooks && analysis.buildingBlocks.hooks.length > 0 && (
                  <Card className="border-[#1E2530] bg-[#161B24]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                        <Zap className="h-4 w-4 text-[#FCD202]" />
                        Hooks
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.buildingBlocks.hooks.map((h, i) => (
                          <li key={i} className="rounded-lg border border-[#2A3140] bg-[#0F1117] px-4 py-3 text-sm text-[#8693A8]">
                            &ldquo;{h}&rdquo;
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {analysis.buildingBlocks.angles && analysis.buildingBlocks.angles.length > 0 && (
                  <Card className="border-[#1E2530] bg-[#161B24]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                        <Target className="h-4 w-4 text-[#FCD202]" />
                        Angles
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.buildingBlocks.angles.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-[#8693A8]">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#FCD202] flex-shrink-0" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {analysis.buildingBlocks.ctas && analysis.buildingBlocks.ctas.length > 0 && (
                  <Card className="border-[#1E2530] bg-[#161B24]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-white">
                        CTAs
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {analysis.buildingBlocks.ctas.map((c, i) => (
                          <span key={i} className="rounded-md border border-[#FCD202]/20 bg-[#FCD202]/5 px-3 py-1.5 text-sm text-[#FCD202]">
                            {c}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {analysis.buildingBlocks.socialProof && analysis.buildingBlocks.socialProof.length > 0 && (
                  <Card className="border-[#1E2530] bg-[#161B24]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-white">
                        Social Proof Elements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.buildingBlocks.socialProof.map((sp, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-[#8693A8]">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                            {sp}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Audience Tab */}
          <TabsContent value="audience" className="mt-4 space-y-4">
            {analysis.targetAudience && (
              <Card className="border-[#1E2530] bg-[#161B24]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <Target className="h-4 w-4 text-[#FCD202]" />
                    Target Audience
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {analysis.targetAudience.age && (
                      <div>
                        <p className="text-xs text-[#5A6478] mb-1">Age Range</p>
                        <p className="text-sm font-medium text-white">
                          {analysis.targetAudience.age}
                        </p>
                      </div>
                    )}
                    {analysis.targetAudience.gender && (
                      <div>
                        <p className="text-xs text-[#5A6478] mb-1">Gender</p>
                        <p className="text-sm font-medium text-white">
                          {analysis.targetAudience.gender}
                        </p>
                      </div>
                    )}
                  </div>
                  {analysis.targetAudience.interests && analysis.targetAudience.interests.length > 0 && (
                    <div>
                      <p className="text-xs text-[#5A6478] mb-2">Interests</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.targetAudience.interests.map((interest, i) => (
                          <span
                            key={i}
                            className="rounded-md border border-[#2A3140] bg-[#1E2530] px-3 py-1 text-xs text-[#8693A8]"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {analysis.emotionalArc && analysis.emotionalArc.length > 0 && (
              <Card className="border-[#1E2530] bg-[#161B24]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-white">
                    Emotional Arc
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.emotionalArc.map((e, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="flex-shrink-0 w-12 text-xs font-mono text-[#5A6478]">
                          {e.time}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-[#8693A8] capitalize">
                              {e.emotion}
                            </span>
                            <span className="text-xs text-[#5A6478]">
                              {e.intensity}/10
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[#1E2530]">
                            <div
                              className="h-full rounded-full bg-[#FCD202]"
                              style={{ width: `${(e.intensity / 10) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="mt-4 space-y-4">
            {analysis.improvements && analysis.improvements.length > 0 && (
              <Card className="border-[#1E2530] bg-[#161B24]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-[#FCD202]" />
                    Improvements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {analysis.improvements.map((imp, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 rounded-lg border border-[#2A3140] bg-[#0F1117] p-3 text-sm text-[#8693A8]"
                      >
                        <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-[#FCD202]/10 text-[#FCD202] text-xs font-bold">
                          {i + 1}
                        </span>
                        {imp}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {analysis.abTestIdeas && analysis.abTestIdeas.length > 0 && (
              <Card className="border-[#1E2530] bg-[#161B24]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-[#FCD202]" />
                    A/B Test Ideas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.abTestIdeas.map((test, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-[#2A3140] bg-[#0F1117] p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-white">
                            {test.name}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              test.expectedImpact === "High"
                                ? "bg-green-500/10 text-green-400"
                                : test.expectedImpact === "Medium"
                                ? "bg-[#FCD202]/10 text-[#FCD202]"
                                : "bg-[#1E2530] text-[#8693A8]"
                            }`}
                          >
                            {test.expectedImpact} Impact
                          </span>
                        </div>
                        <p className="text-sm text-[#8693A8]">
                          {test.hypothesis}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
