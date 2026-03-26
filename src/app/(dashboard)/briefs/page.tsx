import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ClipboardList } from "lucide-react";

const mockBriefs = [
  { id: "1", title: "Q2 Launch Campaign", status: "active", deliverables: 4 },
  { id: "2", title: "Retargeting Refresh", status: "draft", deliverables: 2 },
  { id: "3", title: "Awareness Push — Summer", status: "completed", deliverables: 6 },
];

const statusColor: Record<string, string> = {
  active: "bg-green-500/15 text-green-400 border-green-500/20",
  draft: "bg-[#2A3140] text-[#8693A8] border-[#1E2530]",
  completed: "bg-blue-500/15 text-blue-400 border-blue-500/20",
};

export default function BriefsPage() {
  return (
    <>
      <Header title="Briefs" subtitle="Creative briefs and campaign planning" />
      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <Button className="bg-[#FCD202] text-black hover:bg-[#FCD202]/90 h-8 text-xs font-semibold">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New Brief
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {mockBriefs.map((brief) => (
            <Card key={brief.id} className="border-[#1E2530] bg-[#161B24] hover:border-[#2A3140] cursor-pointer transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1E2530]">
                    <ClipboardList className="h-4 w-4 text-[#FCD202]" />
                  </div>
                  <Badge className={`border text-[10px] capitalize ${statusColor[brief.status]}`}>
                    {brief.status}
                  </Badge>
                </div>
                <p className="font-semibold text-white text-sm mb-1">{brief.title}</p>
                <p className="text-xs text-[#5A6478]">{brief.deliverables} deliverables</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
