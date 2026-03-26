import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, ArrowLeft, TrendingUp, Eye, MousePointer, TrendingDown, Minus, AlertCircle, Film } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface ScoreBar {
  score: number;
  label: string;
  analysis: string;
}

function ScoreCard({ title, score, analysis }: { title: string; score: number; analysis: string }) {
  return (
    <Card className="border-[#1E2530] bg-[#161B24]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-white">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 rounded-full bg-[#1E2530]">
              <div
                className="h-full rounded-full bg-[#FCD202]"
                style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
              />
            </div>
            <span className="text-sm font-bold text-white">{score}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-[#8693A8]">{analysis}</p>
      </CardContent>
    </Card>
  );
}

function LabelBadge({ label }: { label: string }) {
  if (label === "winner") {
    return (
      <Badge className="bg-[#FCD202]/15 text-[#FCD202] border border-[#FCD202]/20 flex items-center gap-1">
        <Trophy className="h-3 w-3" />
        Winner
      </Badge>
    );
  }
  if (label === "loser") {
    return (
      <Badge className="bg-red-500/15 text-red-400 border border-red-500/20 flex items-center gap-1">
        <TrendingDown className="h-3 w-3" />
        Loser
      </Badge>
    );
  }
  return (
    <Badge className="bg-[#1E2530] text-[#8693A8] border border-[#2A3140] flex items-center gap-1">
      <Minus className="h-3 w-3" />
      Neutral
    </Badge>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getScore(obj: any): number {
  return typeof obj?.score === "number" ? obj.score : 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAnalysisText(obj: any): string {
  return typeof obj?.analysis === "string" ? obj.analysis : "No analysis available.";
}

export default async function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const { id } = resolvedParams;

  const supabase = await createClient();
  const { data: ad, error } = await supabase.from("ads").select("*").eq("id", id).single();

  if (error || !ad) {
    console.error("[detail] Failed to load ad:", error?.message);
    notFound();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const analysis: any = ad.analysis || {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metrics: any = ad.metrics || {};

  const hookScore = getScore(analysis.hook);
  const holdScore = getScore(analysis.hold);
  const conversionScore = getScore(analysis.conversion);

  const isImage = ad.file_type?.startsWith("image/");

  const scoreSections: ScoreBar[] = [
    {
      label: "Hook Analysis",
      score: hookScore,
      analysis: getAnalysisText(analysis.hook),
    },
    {
      label: "Hold Analysis",
      score: holdScore,
      analysis: getAnalysisText(analysis.hold),
    },
    {
      label: "Conversion Analysis",
      score: conversionScore,
      analysis: getAnalysisText(analysis.conversion),
    },
  ];

  const metricCards = [
    metrics.roas && { label: "ROAS", value: `${metrics.roas}x`, icon: TrendingUp },
    metrics.hookRate && { label: "Hook Rate", value: `${metrics.hookRate}%`, icon: Eye },
    metrics.ctr && { label: "CTR", value: `${metrics.ctr}%`, icon: MousePointer },
    metrics.spend && { label: "Spend", value: `$${metrics.spend}`, icon: TrendingUp },
  ].filter(Boolean) as { label: string; value: string; icon: React.ElementType }[];

  const recommendations: string[] = Array.isArray(analysis.recommendations)
    ? analysis.recommendations
    : [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildingBlocks: any[] = Array.isArray(analysis.buildingBlocks)
    ? analysis.buildingBlocks
    : [];

  const uploadedAt = new Date(ad.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <Header title="Analysis Detail" subtitle={ad.title} />
      <div className="p-6 space-y-6">
        <Link
          href="/analyze"
          className="flex items-center gap-2 text-sm text-[#8693A8] hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Analyze
        </Link>

        {/* Hero */}
        <div className="flex items-start gap-6">
          {/* Creative preview */}
          <div className="h-40 w-64 rounded-xl bg-[#161B24] border border-[#1E2530] flex items-center justify-center flex-shrink-0 overflow-hidden">
            {ad.file_url && isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ad.file_url}
                alt={ad.title}
                className="h-full w-full object-cover"
              />
            ) : ad.file_url ? (
              <div className="flex flex-col items-center gap-2">
                <Film className="h-10 w-10 text-[#5A6478]" />
                <span className="text-xs text-[#5A6478]">Video</span>
              </div>
            ) : (
              <span className="text-[#5A6478] text-sm">No preview</span>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-white">{ad.title}</h2>
              <LabelBadge label={ad.label} />
            </div>
            <p className="text-sm text-[#5A6478] mb-4 capitalize">
              {ad.platform} · Uploaded {uploadedAt}
            </p>

            {metricCards.length > 0 ? (
              <div className="grid grid-cols-4 gap-3">
                {metricCards.map((m) => (
                  <div key={m.label} className="rounded-lg bg-[#161B24] border border-[#1E2530] p-3">
                    <p className="text-xs text-[#5A6478]">{m.label}</p>
                    <p className="mt-1 text-lg font-bold text-white">{m.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#5A6478]">No performance metrics provided.</p>
            )}
          </div>
        </div>

        {/* Gemini summary */}
        {analysis.summary && (
          <Card className="border-[#1E2530] bg-[#161B24]">
            <CardContent className="p-4">
              <p className="text-sm text-[#8693A8]">{analysis.summary}</p>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="analysis">
          <TabsList className="bg-[#161B24] border border-[#1E2530]">
            {["analysis", "building-blocks", "recommendations"].map((t) => (
              <TabsTrigger
                key={t}
                value={t}
                className="capitalize text-[#8693A8] data-[state=active]:bg-[#FCD202] data-[state=active]:text-black"
              >
                {t.replace("-", " ")}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Analysis tab */}
          <TabsContent value="analysis" className="mt-4 space-y-4">
            {/* Hook type / pattern */}
            {analysis.hook?.type && (
              <div className="flex items-center gap-3">
                <span className="rounded-md border border-[#2A3140] bg-[#1E2530] px-3 py-1.5 text-xs font-medium text-[#8693A8]">
                  Hook Type: <span className="text-white">{analysis.hook.type}</span>
                </span>
                {analysis.hook?.pattern && (
                  <span className="rounded-md border border-[#2A3140] bg-[#1E2530] px-3 py-1.5 text-xs font-medium text-[#8693A8]">
                    Pattern: <span className="text-white">{analysis.hook.pattern}</span>
                  </span>
                )}
              </div>
            )}
            {scoreSections.map((s) => (
              <ScoreCard key={s.label} title={s.label} score={s.score} analysis={s.analysis} />
            ))}
          </TabsContent>

          {/* Building blocks tab */}
          <TabsContent value="building-blocks" className="mt-4">
            {buildingBlocks.length > 0 ? (
              <div className="space-y-3">
                {buildingBlocks.map((block, i) => (
                  <Card key={i} className="border-[#1E2530] bg-[#161B24]">
                    <CardContent className="p-4 flex items-start gap-3">
                      <span
                        className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${
                          block.performance === "high"
                            ? "bg-[#FCD202]"
                            : block.performance === "medium"
                            ? "bg-blue-400"
                            : "bg-red-400"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-white">{block.label}</p>
                        <p className="mt-0.5 text-xs text-[#5A6478] capitalize">{block.type}</p>
                        <p className="mt-1 text-sm text-[#8693A8]">{block.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-[#1E2530] bg-[#161B24]">
                <CardContent className="p-6">
                  <p className="text-sm text-[#5A6478]">
                    No building blocks extracted from this analysis.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Recommendations tab */}
          <TabsContent value="recommendations" className="mt-4">
            {recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendations.map((rec, i) => (
                  <Card key={i} className="border-[#1E2530] bg-[#161B24]">
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#FCD202]/15 text-xs font-bold text-[#FCD202]">
                        {i + 1}
                      </div>
                      <p className="text-sm text-[#8693A8]">{rec}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-[#1E2530] bg-[#161B24]">
                <CardContent className="p-6">
                  <p className="text-sm text-[#5A6478]">
                    No recommendations available for this analysis.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Raw analysis fallback */}
        {analysis.raw && (
          <Card className="border-[#1E2530] bg-[#161B24]">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <CardTitle className="text-sm font-semibold text-white">Raw Analysis</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-[#8693A8]">{analysis.raw}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
