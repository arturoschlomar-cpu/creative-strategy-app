import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, ArrowLeft, TrendingUp, Eye, MousePointer, Minus, TrendingDown, AlertCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AnalysisDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: ad, error } = await supabase
    .from("ads")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !ad) {
    notFound();
  }

  const analysis = ad.analysis;
  const metrics = ad.metrics || {};

  const labelConfig = {
    winner: { icon: <Trophy className="h-3 w-3" />, color: "bg-[#FCD202]/15 text-[#FCD202] border border-[#FCD202]/20" },
    neutral: { icon: <Minus className="h-3 w-3" />, color: "bg-[#1E2530] text-[#8693A8] border border-[#2A3140]" },
    loser: { icon: <TrendingDown className="h-3 w-3" />, color: "bg-red-500/10 text-red-400 border border-red-500/30" },
  };

  const currentLabel = labelConfig[ad.label as keyof typeof labelConfig] || labelConfig.neutral;

  const displayMetrics = [
    metrics.roas && { label: "ROAS", value: `${metrics.roas}x`, icon: TrendingUp },
    metrics.hookRate && { label: "Hook Rate", value: `${metrics.hookRate}%`, icon: Eye },
    metrics.ctr && { label: "CTR", value: `${metrics.ctr}%`, icon: MousePointer },
    metrics.spend && { label: "Spend", value: `$${Number(metrics.spend).toLocaleString()}`, icon: TrendingUp },
  ].filter(Boolean) as { label: string; value: string; icon: React.ElementType }[];

  return (
    <>
      <Header title="Analysis Detail" subtitle={ad.title || "Creative Analysis"} />
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
          {ad.file_url ? (
            <div className="h-40 w-64 rounded-xl overflow-hidden border border-[#1E2530] flex-shrink-0 bg-[#161B24]">
              {ad.format === "video" ? (
                <video
                  src={ad.file_url}
                  className="h-full w-full object-cover"
                  controls={false}
                  muted
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ad.file_url}
                  alt={ad.title}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          ) : (
            <div className="h-40 w-64 rounded-xl bg-[#161B24] border border-[#1E2530] flex items-center justify-center flex-shrink-0">
              <span className="text-[#5A6478] text-sm">No Preview</span>
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-white">{ad.title || "Untitled Creative"}</h2>
              <Badge className={`flex items-center gap-1 capitalize ${currentLabel.color}`}>
                {currentLabel.icon}
                {ad.label}
              </Badge>
            </div>
            <p className="text-sm text-[#5A6478] mb-4 capitalize">
              {ad.platform} · {ad.format} · {new Date(ad.created_at).toLocaleDateString()}
            </p>

            {/* Overall score */}
            {analysis?.overallScore !== undefined && (
              <div className="mb-4 flex items-center gap-3">
                <span className="text-xs text-[#8693A8]">Overall Score</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-32 rounded-full bg-[#1E2530]">
                    <div
                      className="h-full rounded-full bg-[#FCD202]"
                      style={{ width: `${analysis.overallScore}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-white">{analysis.overallScore}</span>
                </div>
              </div>
            )}

            {displayMetrics.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {displayMetrics.map((m) => (
                  <div key={m.label} className="rounded-lg bg-[#161B24] border border-[#1E2530] p-3">
                    <p className="text-xs text-[#5A6478]">{m.label}</p>
                    <p className="mt-1 text-lg font-bold text-white">{m.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {!analysis ? (
          <Card className="border-[#1E2530] bg-[#161B24]">
            <CardContent className="p-6 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-[#8693A8]" />
              <p className="text-sm text-[#8693A8]">No analysis data available for this creative.</p>
            </CardContent>
          </Card>
        ) : (
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

            <TabsContent value="analysis" className="mt-4 space-y-4">
              {[
                {
                  title: "Hook Analysis",
                  score: analysis.hook?.score,
                  content: analysis.hook ? (
                    <div className="space-y-3">
                      <div className="flex gap-4 text-sm">
                        <span className="text-[#5A6478]">Type:</span>
                        <span className="text-white">{analysis.hook.type}</span>
                      </div>
                      <p className="text-sm text-[#8693A8]">{analysis.hook.pattern}</p>
                      {analysis.hook.strengths?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-[#5A6478] mb-1">Strengths</p>
                          <ul className="space-y-1">
                            {analysis.hook.strengths.map((s: string, i: number) => (
                              <li key={i} className="text-sm text-[#8693A8] flex gap-2">
                                <span className="text-green-400 mt-0.5">+</span>{s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {analysis.hook.weaknesses?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-[#5A6478] mb-1">Weaknesses</p>
                          <ul className="space-y-1">
                            {analysis.hook.weaknesses.map((w: string, i: number) => (
                              <li key={i} className="text-sm text-[#8693A8] flex gap-2">
                                <span className="text-red-400 mt-0.5">−</span>{w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : null,
                },
                {
                  title: "Hold Analysis",
                  score: analysis.hold?.score,
                  content: analysis.hold ? (
                    <div className="space-y-3">
                      <p className="text-sm text-[#8693A8]"><span className="text-[#5A6478]">Pacing: </span>{analysis.hold.pacing}</p>
                      <p className="text-sm text-[#8693A8]"><span className="text-[#5A6478]">Narrative: </span>{analysis.hold.narrative}</p>
                      {analysis.hold.techniques?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {analysis.hold.techniques.map((t: string, i: number) => (
                            <span key={i} className="rounded-full bg-[#1E2530] px-3 py-1 text-xs text-[#8693A8]">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null,
                },
                {
                  title: "Conversion Analysis",
                  score: analysis.conversion?.score,
                  content: analysis.conversion ? (
                    <div className="space-y-2">
                      {[
                        ["CTA", analysis.conversion.cta],
                        ["Offer", analysis.conversion.offer],
                        ["Urgency", analysis.conversion.urgency],
                      ].map(([label, value]) => value && (
                        <p key={label} className="text-sm text-[#8693A8]">
                          <span className="text-[#5A6478]">{label}: </span>{value}
                        </p>
                      ))}
                    </div>
                  ) : null,
                },
              ].map((section) => (
                <Card key={section.title} className="border-[#1E2530] bg-[#161B24]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold text-white">{section.title}</CardTitle>
                      {section.score !== undefined && (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 rounded-full bg-[#1E2530]">
                            <div
                              className="h-full rounded-full bg-[#FCD202]"
                              style={{ width: `${section.score}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-white">{section.score}</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  {section.content && (
                    <CardContent>{section.content}</CardContent>
                  )}
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="building-blocks" className="mt-4 space-y-3">
              {analysis.buildingBlocks?.length > 0 ? (
                analysis.buildingBlocks.map((block: { type: string; label: string; description: string; performance: string }, i: number) => (
                  <Card key={i} className="border-[#1E2530] bg-[#161B24]">
                    <CardContent className="p-4 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="rounded bg-[#1E2530] px-2 py-0.5 text-xs text-[#8693A8] capitalize">{block.type}</span>
                          <span className="text-sm font-medium text-white">{block.label}</span>
                        </div>
                        <p className="text-sm text-[#8693A8]">{block.description}</p>
                      </div>
                      <span className={`text-xs font-medium rounded-full px-2 py-1 flex-shrink-0 ${
                        block.performance === "high"
                          ? "bg-green-500/10 text-green-400"
                          : block.performance === "medium"
                          ? "bg-yellow-500/10 text-yellow-400"
                          : "bg-red-500/10 text-red-400"
                      }`}>
                        {block.performance}
                      </span>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-[#1E2530] bg-[#161B24]">
                  <CardContent className="p-6">
                    <p className="text-sm text-[#5A6478]">No building blocks extracted.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="recommendations" className="mt-4">
              <Card className="border-[#1E2530] bg-[#161B24]">
                <CardContent className="p-6">
                  {analysis.recommendations?.length > 0 ? (
                    <ul className="space-y-3">
                      {analysis.recommendations.map((rec: string, i: number) => (
                        <li key={i} className="flex gap-3 text-sm text-[#8693A8]">
                          <span className="text-[#FCD202] font-bold flex-shrink-0">{i + 1}.</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-[#5A6478]">No recommendations available.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );
}
