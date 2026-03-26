"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Blocks, TrendingUp, Loader2, CheckCircle2, FlaskConical, XCircle, Filter } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface BuildingBlock {
  id: string;
  type: string;
  content: string;
  status: string;
  metadata: Record<string, string>;
  ad_id: string | null;
  created_at: string;
  ads?: { title: string };
}

const typeColor: Record<string, string> = {
  hook: "bg-[#FCD202]/15 text-[#FCD202] border-[#FCD202]/20",
  angle: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  benefit: "bg-green-500/15 text-green-400 border-green-500/20",
  social_proof: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  cta: "bg-orange-500/15 text-orange-400 border-orange-500/20",
};

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  testing: { label: "Testing", icon: <FlaskConical className="h-3 w-3" />, color: "bg-[#FCD202]/15 text-[#FCD202] border-[#FCD202]/20" },
  validated: { label: "Validated", icon: <CheckCircle2 className="h-3 w-3" />, color: "bg-green-500/15 text-green-400 border-green-500/20" },
  failed: { label: "Failed", icon: <XCircle className="h-3 w-3" />, color: "bg-red-500/15 text-red-400 border-red-500/20" },
};

const allTypes = ["all", "hook", "angle", "benefit", "social_proof", "cta"];
const allStatuses = ["all", "testing", "validated", "failed"];

export default function BuildingBlocksPage() {
  const [blocks, setBlocks] = useState<BuildingBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadBlocks();
  }, []);

  async function loadBlocks() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("building_blocks")
        .select("*, ads(title)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBlocks(data || []);
    } catch (err) {
      console.error("Failed to load building blocks:", err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, newStatus: string) {
    setUpdatingId(id);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("building_blocks")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      setBlocks(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = blocks.filter(b => {
    if (typeFilter !== "all" && b.type !== typeFilter) return false;
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    return true;
  });

  const counts = {
    validated: blocks.filter(b => b.status === "validated").length,
    testing: blocks.filter(b => b.status === "testing").length,
    total: blocks.length,
  };

  return (
    <>
      <Header title="Building Blocks" subtitle="Validated creative elements extracted from your ad library" />
      <div className="p-6 space-y-4">

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Blocks", value: counts.total, color: "text-white" },
            { label: "Validated", value: counts.validated, color: "text-green-400" },
            { label: "Testing", value: counts.testing, color: "text-[#FCD202]" },
          ].map(s => (
            <Card key={s.label} className="border-[#1E2530] bg-[#161B24]">
              <CardContent className="p-4">
                <p className="text-xs text-[#5A6478]">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="h-4 w-4 text-[#5A6478]" />
          <div className="flex gap-1.5">
            {allTypes.map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-all capitalize ${
                  typeFilter === t
                    ? "bg-[#FCD202] text-black"
                    : "border border-[#1E2530] text-[#5A6478] hover:border-[#2A3140] hover:text-[#8693A8]"
                }`}
              >
                {t.replace("_", " ")}
              </button>
            ))}
          </div>
          <div className="h-4 w-px bg-[#1E2530]" />
          <div className="flex gap-1.5">
            {allStatuses.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-all capitalize ${
                  statusFilter === s
                    ? "bg-[#2A3140] text-white"
                    : "border border-[#1E2530] text-[#5A6478] hover:border-[#2A3140] hover:text-[#8693A8]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#FCD202]" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-[#1E2530] bg-[#161B24]">
            <CardContent className="p-8 text-center">
              <Blocks className="h-8 w-8 text-[#2A3140] mx-auto mb-3" />
              <p className="text-sm text-[#5A6478]">
                {blocks.length === 0
                  ? "No building blocks yet. Analyze ads to automatically extract hooks, angles, benefits, and CTAs."
                  : "No blocks match your current filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filtered.map((block) => {
              const cfg = statusConfig[block.status] || statusConfig.testing;
              return (
                <Card key={block.id} className="border-[#1E2530] bg-[#161B24] hover:border-[#2A3140] transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1E2530]">
                        <Blocks className="h-4 w-4 text-[#FCD202]" />
                      </div>
                      <Badge className={`border text-[10px] capitalize ${typeColor[block.type] || typeColor.hook}`}>
                        {block.type.replace("_", " ")}
                      </Badge>
                    </div>

                    <p className="font-medium text-white text-sm mb-1 line-clamp-2">{block.content}</p>

                    {block.metadata?.hookType && (
                      <p className="text-[10px] text-[#5A6478] mb-2">{block.metadata.hookType}</p>
                    )}
                    {block.metadata?.epicType && (
                      <p className="text-[10px] text-[#5A6478] mb-2">{block.metadata.epicType}</p>
                    )}

                    {block.ads?.title && (
                      <p className="text-[10px] text-[#5A6478] mb-3 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        From: {block.ads.title}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1E2530]">
                      <Badge className={`border text-[10px] flex items-center gap-1 ${cfg.color}`}>
                        {cfg.icon}
                        {cfg.label}
                      </Badge>
                      <div className="flex gap-1">
                        {["testing", "validated", "failed"].filter(s => s !== block.status).map(s => (
                          <button
                            key={s}
                            onClick={() => updateStatus(block.id, s)}
                            disabled={updatingId === block.id}
                            className="text-[10px] text-[#5A6478] hover:text-[#8693A8] capitalize transition-colors disabled:opacity-50"
                          >
                            {updatingId === block.id ? "..." : `→ ${s}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
