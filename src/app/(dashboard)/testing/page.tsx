import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, FlaskConical } from "lucide-react";

const experiments = [
  { id: "1", name: "Hook Type Test — Pain vs Question", status: "running", variants: 2, days: 3 },
  { id: "2", name: "CTA Placement — Middle vs End", status: "completed", variants: 2, days: 7 },
  { id: "3", name: "UGC vs Polished Format", status: "draft", variants: 2, days: 0 },
];

const statusColor: Record<string, string> = {
  running: "bg-green-500/15 text-green-400 border-green-500/20",
  completed: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  draft: "bg-[#2A3140] text-[#8693A8] border-[#1E2530]",
};

export default function TestingPage() {
  return (
    <>
      <Header title="Testing" subtitle="A/B experiments and creative hypotheses" />
      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <Button className="bg-[#FCD202] text-black hover:bg-[#FCD202]/90 h-8 text-xs font-semibold">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New Experiment
          </Button>
        </div>
        <div className="space-y-3">
          {experiments.map((exp) => (
            <Card key={exp.id} className="border-[#1E2530] bg-[#161B24] hover:border-[#2A3140] cursor-pointer transition-colors">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1E2530]">
                  <FlaskConical className="h-5 w-5 text-[#FCD202]" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white text-sm">{exp.name}</p>
                  <p className="text-xs text-[#5A6478]">{exp.variants} variants{exp.days > 0 ? ` · ${exp.days} days running` : ""}</p>
                </div>
                <Badge className={`border text-[10px] capitalize ${statusColor[exp.status]}`}>
                  {exp.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
