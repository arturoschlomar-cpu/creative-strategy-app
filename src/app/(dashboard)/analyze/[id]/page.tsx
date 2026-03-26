import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, ArrowLeft, TrendingUp, Eye, MousePointer } from "lucide-react";
import Link from "next/link";

export default function AnalysisDetailPage({ params }: { params: { id: string } }) {
  return (
    <>
      <Header title="Analysis Detail" subtitle={`Creative ID: ${params.id}`} />
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
          <div className="h-40 w-64 rounded-xl bg-[#161B24] border border-[#1E2530] flex items-center justify-center flex-shrink-0">
            <span className="text-[#5A6478] text-sm">Creative Preview</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-white">Pain Point Hook v2</h2>
              <Badge className="bg-[#FCD202]/15 text-[#FCD202] border border-[#FCD202]/20 flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                Winner
              </Badge>
            </div>
            <p className="text-sm text-[#5A6478] mb-4">Meta · Uploaded 2 days ago</p>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "ROAS", value: "4.2x", icon: TrendingUp },
                { label: "Hook Rate", value: "38%", icon: Eye },
                { label: "CTR", value: "2.8%", icon: MousePointer },
                { label: "Spend", value: "$2,400", icon: TrendingUp },
              ].map((m) => (
                <div key={m.label} className="rounded-lg bg-[#161B24] border border-[#1E2530] p-3">
                  <p className="text-xs text-[#5A6478]">{m.label}</p>
                  <p className="mt-1 text-lg font-bold text-white">{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

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

          <TabsContent value="analysis" className="mt-4 space-y-4">
            {[
              {
                title: "Hook Analysis",
                score: 82,
                content: "Strong pain-point hook that immediately addresses the audience's primary frustration. The opening 3 seconds effectively capture attention with a relatable scenario.",
              },
              {
                title: "Hold Analysis",
                score: 74,
                content: "Good narrative flow with effective use of tension and resolution. The pacing keeps viewers engaged through the middle section.",
              },
              {
                title: "Conversion Analysis",
                score: 68,
                content: "CTA is clear but could be stronger. The offer is compelling, but urgency elements are missing. Consider adding a time-limited offer.",
              },
            ].map((section) => (
              <Card key={section.title} className="border-[#1E2530] bg-[#161B24]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-white">{section.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 rounded-full bg-[#1E2530]">
                        <div
                          className="h-full rounded-full bg-[#FCD202]"
                          style={{ width: `${section.score}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-white">{section.score}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[#8693A8]">{section.content}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="building-blocks" className="mt-4">
            <Card className="border-[#1E2530] bg-[#161B24]">
              <CardContent className="p-6">
                <p className="text-sm text-[#5A6478]">Building blocks extracted from this creative will appear here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="mt-4">
            <Card className="border-[#1E2530] bg-[#161B24]">
              <CardContent className="p-6">
                <p className="text-sm text-[#5A6478]">AI-generated recommendations for improving or iterating on this creative will appear here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
