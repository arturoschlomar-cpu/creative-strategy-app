import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Brain, MousePointer } from "lucide-react";

const framework = [
  {
    letter: "A",
    name: "Attract",
    subtitle: "Hook & Stop the Scroll",
    icon: Eye,
    color: "text-[#FCD202]",
    bg: "bg-[#FCD202]/10",
    border: "border-[#FCD202]/20",
    score: 78,
    principles: [
      "Pattern interrupt in first 1-3 seconds",
      "Address the pain point or desire immediately",
      "Visual or audio hook that creates curiosity",
      "Native content style (UGC, lo-fi, platform-native)",
    ],
    metrics: ["Hook Rate > 30%", "3-sec View Rate > 50%"],
  },
  {
    letter: "A",
    name: "Absorb",
    subtitle: "Hold Attention & Build Desire",
    icon: Brain,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    score: 64,
    principles: [
      "Maintain tension through storytelling",
      "Show, don't tell — demonstrate the transformation",
      "Stack social proof naturally",
      "Keep pacing tight — cut every unnecessary second",
    ],
    metrics: ["Hold Rate > 40%", "ThruPlay Rate > 25%"],
  },
  {
    letter: "A",
    name: "Act",
    subtitle: "Convert & Drive Action",
    icon: MousePointer,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    score: 52,
    principles: [
      "Single, clear call-to-action",
      "Reinforce the offer with urgency or scarcity",
      "Remove friction — make next step obvious",
      "Match the CTA to the audience temperature",
    ],
    metrics: ["CTR > 1.5%", "CVR > 2%", "ROAS > 2.5x"],
  },
];

export default function FrameworkPage() {
  return (
    <>
      <Header title="3A Framework" subtitle="The 99ads Winning Creative System — Attract, Absorb, Act" />
      <div className="p-6 space-y-6">

        {/* Overview bar */}
        <div className="rounded-xl border border-[#1E2530] bg-[#161B24] p-5">
          <p className="text-xs font-medium text-[#5A6478] mb-3">Portfolio Framework Score</p>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-3 rounded-full bg-[#1E2530] overflow-hidden">
              <div className="h-full w-[65%] rounded-full bg-gradient-to-r from-[#FCD202] via-blue-500 to-green-400" />
            </div>
            <span className="text-lg font-bold text-white">65 / 100</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {framework.map((stage) => (
            <Card key={stage.name} className={`border bg-[#161B24] ${stage.border}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stage.bg}`}>
                    <stage.icon className={`h-5 w-5 ${stage.color}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-black ${stage.color}`}>{stage.letter}</span>
                      <CardTitle className="text-sm font-bold text-white">{stage.name}</CardTitle>
                    </div>
                    <p className="text-xs text-[#5A6478]">{stage.subtitle}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#5A6478]">Stage Score</span>
                    <span className={`font-bold ${stage.color}`}>{stage.score}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[#1E2530]">
                    <div
                      className={`h-full rounded-full ${stage.bg.replace("/10", "")}`}
                      style={{ width: `${stage.score}%`, background: stage.color.includes("FCD202") ? "#FCD202" : stage.color.includes("blue") ? "#3b82f6" : "#4ade80" }}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-[#8693A8] mb-2 uppercase tracking-wider">Principles</p>
                  <ul className="space-y-1.5">
                    {stage.principles.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-xs text-[#8693A8]">
                        <span className={`mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${stage.color.replace("text-", "bg-")}`} />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#8693A8] mb-2 uppercase tracking-wider">Target Metrics</p>
                  <div className="flex flex-wrap gap-1.5">
                    {stage.metrics.map((m) => (
                      <span key={m} className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${stage.border} ${stage.color}`}>
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
