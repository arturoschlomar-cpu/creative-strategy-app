import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Trophy, TrendingDown, Minus } from "lucide-react";
import Link from "next/link";

const mockAds = [
  { id: "1", title: "Summer Sale UGC v3", label: "winner", roas: "4.2x", platform: "Meta", spend: "$2.4k" },
  { id: "2", title: "Product Demo — Hook B", label: "neutral", roas: "2.1x", platform: "TikTok", spend: "$800" },
  { id: "3", title: "Testimonial Carousel", label: "loser", roas: "0.9x", platform: "Meta", spend: "$350" },
  { id: "4", title: "Pain Point Hook v1", label: "winner", roas: "5.1x", platform: "Meta", spend: "$5.2k" },
  { id: "5", title: "Unboxing Experience", label: "winner", roas: "3.7x", platform: "TikTok", spend: "$1.8k" },
  { id: "6", title: "Before & After v2", label: "neutral", roas: "2.4x", platform: "YouTube", spend: "$620" },
];

const labelIcon = { winner: Trophy, loser: TrendingDown, neutral: Minus };
const labelColor = {
  winner: "bg-[#FCD202]/15 text-[#FCD202] border-[#FCD202]/20",
  loser: "bg-red-500/15 text-red-400 border-red-500/20",
  neutral: "bg-[#2A3140] text-[#8693A8] border-[#1E2530]",
};

export default function LibraryPage() {
  return (
    <>
      <Header title="Ad Library" subtitle="All your analyzed creatives in one place" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {["All", "Winners", "Testing", "Losers"].map((f) => (
              <button
                key={f}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  f === "All"
                    ? "bg-[#FCD202] text-black"
                    : "border border-[#1E2530] text-[#8693A8] hover:border-[#2A3140] hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
            <button className="flex items-center gap-1.5 rounded-md border border-[#1E2530] px-3 py-1.5 text-xs font-medium text-[#8693A8] hover:border-[#2A3140] hover:text-white">
              <Filter className="h-3.5 w-3.5" /> Filter
            </button>
          </div>
          <Link href="/analyze">
            <Button className="bg-[#FCD202] text-black hover:bg-[#FCD202]/90 h-8 text-xs font-semibold">
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Creative
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {mockAds.map((ad) => {
            const Icon = labelIcon[ad.label as keyof typeof labelIcon];
            return (
              <Link key={ad.id} href={`/analyze/${ad.id}`}>
                <Card className="cursor-pointer border-[#1E2530] bg-[#161B24] hover:border-[#2A3140] transition-colors">
                  <div className="aspect-video rounded-t-lg bg-[#0F1117] flex items-center justify-center">
                    <span className="text-[#2A3140] text-xs">Preview</span>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-medium text-white leading-snug">{ad.title}</p>
                      <Badge className={`border text-[10px] flex-shrink-0 flex items-center gap-1 capitalize ${labelColor[ad.label as keyof typeof labelColor]}`}>
                        <Icon className="h-2.5 w-2.5" />
                        {ad.label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#5A6478]">
                      <span>{ad.platform}</span>
                      <span>ROAS {ad.roas}</span>
                      <span>{ad.spend}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
