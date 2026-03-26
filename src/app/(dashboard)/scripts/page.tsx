import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Clock } from "lucide-react";

const mockScripts = [
  { id: "1", title: "Pain Point Hook — 30s", platform: "Meta", duration: "30s", date: "2 days ago" },
  { id: "2", title: "Product Demo Script", platform: "TikTok", duration: "60s", date: "5 days ago" },
  { id: "3", title: "Testimonial Format v2", platform: "YouTube", duration: "90s", date: "1 week ago" },
];

export default function ScriptsPage() {
  return (
    <>
      <Header title="Scripts" subtitle="AI-generated and saved ad scripts" />
      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <Button className="bg-[#FCD202] text-black hover:bg-[#FCD202]/90 h-8 text-xs font-semibold">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Generate Script
          </Button>
        </div>
        <div className="space-y-3">
          {mockScripts.map((script) => (
            <Card key={script.id} className="border-[#1E2530] bg-[#161B24] hover:border-[#2A3140] cursor-pointer transition-colors">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1E2530]">
                  <FileText className="h-5 w-5 text-[#FCD202]" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white text-sm">{script.title}</p>
                  <p className="text-xs text-[#5A6478]">{script.platform} · {script.duration}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-[#5A6478]">
                  <Clock className="h-3.5 w-3.5" />
                  {script.date}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
