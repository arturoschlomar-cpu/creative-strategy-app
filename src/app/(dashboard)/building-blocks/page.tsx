import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Blocks, TrendingUp } from "lucide-react";

const blocks = [
  { id: "1", type: "hook", label: "Pain Point Open", performance: "high", uses: 12, wins: 9 },
  { id: "2", type: "hook", label: "Question Hook", performance: "high", uses: 8, wins: 6 },
  { id: "3", type: "body", label: "Before/After Narrative", performance: "high", uses: 10, wins: 7 },
  { id: "4", type: "cta", label: "Urgency CTA", performance: "medium", uses: 15, wins: 6 },
  { id: "5", type: "visual", label: "Product Close-up", performance: "medium", uses: 20, wins: 8 },
  { id: "6", type: "body", label: "Social Proof Stack", performance: "high", uses: 7, wins: 6 },
];

const typeColor: Record<string, string> = {
  hook: "bg-[#FCD202]/15 text-[#FCD202] border-[#FCD202]/20",
  body: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  cta: "bg-green-500/15 text-green-400 border-green-500/20",
  visual: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  audio: "bg-pink-500/15 text-pink-400 border-pink-500/20",
};

const perfColor: Record<string, string> = {
  high: "text-green-400",
  medium: "text-[#FCD202]",
  low: "text-red-400",
};

export default function BuildingBlocksPage() {
  return (
    <>
      <Header title="Building Blocks" subtitle="Validated creative elements extracted from your ad library" />
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {blocks.map((block) => {
            const winRate = Math.round((block.wins / block.uses) * 100);
            return (
              <Card key={block.id} className="border-[#1E2530] bg-[#161B24] hover:border-[#2A3140] cursor-pointer transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1E2530]">
                      <Blocks className="h-4 w-4 text-[#FCD202]" />
                    </div>
                    <Badge className={`border text-[10px] capitalize ${typeColor[block.type]}`}>
                      {block.type}
                    </Badge>
                  </div>
                  <p className="font-semibold text-white text-sm mb-3">{block.label}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#5A6478]">{block.uses} uses</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className={`h-3.5 w-3.5 ${perfColor[block.performance]}`} />
                      <span className={`font-semibold ${perfColor[block.performance]}`}>{winRate}% win rate</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
