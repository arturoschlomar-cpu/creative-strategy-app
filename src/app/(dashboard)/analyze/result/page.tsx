"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  ArrowLeft,
  TrendingUp,
  Zap,
  Users,
  BarChart2,
  Puzzle,
  Heart,
  CheckCircle2,
  XCircle,
  FlaskConical,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface AnalysisResult {
  id?: string;
  title?: string;
  platform?: string;
  label?: string;
  metrics?: Record<string, string>;
  fileUrl?: string;
  analysis: {
    hook?: { score: number; analysis: string };
    hold?: { score: number; analysis: string };
    conversion?: { score: number; analysis: string };
    overall_score?: number;
    summary?: string;
    ad_format?: string;
    elements?: { name: string; percentage: number }[];
    visual_breakdown?: { element: string; presence: string; impact: string }[];
    strategy?: {
      why_it_worked?: string;
      strengths?: string[];
      weaknesses?: string[];
      psychology_principles?: string[];
      improvements?: string[];
    };
    audience?: {
      persona_name?: string;
      persona_description?: string;
      pain_points?: string[];
      interests?: string[];
      demographics?: {
        age?: string;
        gender?: string;
        income?: string;
        location?: string;
      };
    };
    growth?: {
      ab_tests?: { name: string; hypothesis: string; impact: string }[];
      scaling_recommendations?: string[];
    };
    building_blocks?: {
      hooks?: string[];
      angles?: string[];
      ctas?: string[];
      social_proof?: string[];
    };
    emotional_arc?: { label: string; intensity: number; emotion: string }[];
  };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PIE_COLORS = ["#F97316", "#FB923C", "#FDBA74", "#FED7AA", "#FFF7ED", "#EA580C"];

const IMPACT_COLORS: Record<string, string> = {
  High: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  Medium: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  Low: "bg-zinc-700/50 text-zinc-400 border border-zinc-600/30",
};

const PRESENCE_COLORS: Record<string, string> = {
  Strong: "text-green-400",
  Present: "text-blue-400",
  Weak: "text-yellow-400",
  Absent: "text-zinc-500",
};

const TABS = [
  { id: "analysis", label: "Analysis", icon: BarChart2 },
  { id: "strategy", label: "Strategy", icon: TrendingUp },
  { id: "audience", label: "Audience", icon: Users },
  { id: "growth", label: "Growth", icon: Zap },
  { id: "building-blocks", label: "Building Blocks", icon: Puzzle },
  { id: "emotional-arc", label: "Emotional Arc", icon: Heart },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function HookGauge({ score }: { score: number }) {
  const radius = 54;
  const circumference = Math.PI * radius; // half circle = πr
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#F97316" : score >= 45 ? "#FBBF24" : "#EF4444";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="140" height="80" viewBox="0 0 140 80">
        {/* Background arc */}
        <path
          d="M 15 75 A 55 55 0 0 1 125 75"
          fill="none"
          stroke="#27272A"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d="M 15 75 A 55 55 0 0 1 125 75"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <text x="70" y="65" textAnchor="middle" fill="#FAFAFA" fontSize="22" fontWeight="bold">
          {score}
        </text>
        <text x="70" y="78" textAnchor="middle" fill="#71717A" fontSize="9">
          HOOK SCORE
        </text>
      </svg>
    </div>
  );
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 70 ? "#F97316" : score >= 45 ? "#FBBF24" : "#EF4444";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className="font-bold text-white">{score}</span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function Pill({ text, color }: { text: string; color: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${color}`}>
      {text}
    </span>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-5 space-y-3">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {children}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AnalysisResultPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState("analysis");

  useEffect(() => {
    const raw = localStorage.getItem("analysisResult");
    if (!raw) {
      router.push("/analyze");
      return;
    }
    try {
      setData(JSON.parse(raw));
    } catch {
      router.push("/analyze");
    }
  }, [router]);

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F97316] border-t-transparent" />
      </div>
    );
  }

  const a = data.analysis ?? {};
  const overallScore = a.overall_score ?? 0;
  const hookScore = a.hook?.score ?? 0;
  const holdScore = a.hold?.score ?? 0;
  const conversionScore = a.conversion?.score ?? 0;

  return (
    <div className="min-h-screen bg-[#0F1117] text-[#FAFAFA]">
      {/* Header */}
      <div className="border-b border-[#27272A] bg-[#0F1117] px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link
            href="/analyze"
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            New Analysis
          </Link>
          <div className="text-center">
            <h1 className="text-base font-bold text-white">{data.title || "Ad Creative Analysis"}</h1>
            <p className="text-xs text-zinc-500 capitalize">{data.platform} · {data.label}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-[#F97316]/15 border border-[#F97316]/30 px-3 py-1 text-sm font-bold text-[#F97316]">
              {overallScore} / 100
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-6 space-y-6">
        {/* Tab Nav */}
        <div className="flex gap-1 rounded-xl border border-[#27272A] bg-[#18181B] p-1 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 min-w-max items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-[#F97316] text-white shadow"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── TAB 1: ANALYSIS ───────────────────────────────────────── */}
        {activeTab === "analysis" && (
          <div className="space-y-4">
            {/* Executive Summary */}
            <SectionCard title="Executive Summary">
              <p className="text-sm text-zinc-400 leading-relaxed">{a.summary || "No summary available."}</p>
              <div className="grid grid-cols-3 gap-3 pt-1">
                <ScoreBar score={hookScore} label="Hook" />
                <ScoreBar score={holdScore} label="Hold" />
                <ScoreBar score={conversionScore} label="Conversion" />
              </div>
            </SectionCard>

            {/* Hook Score Gauge + Hook Analysis side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-5 flex flex-col items-center justify-center gap-3">
                <HookGauge score={hookScore} />
                <p className="text-xs text-zinc-500 text-center leading-relaxed">
                  {a.hook?.analysis || "No hook analysis."}
                </p>
              </div>

              <SectionCard title="Ad Format">
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-[#F97316]/15 border border-[#F97316]/25 px-3 py-1.5 text-sm font-semibold text-[#F97316]">
                    {a.ad_format || "Unknown"}
                  </span>
                </div>
                <div className="space-y-2 pt-1">
                  {a.hold && (
                    <div>
                      <p className="text-xs font-medium text-zinc-400 mb-1">Hold Analysis</p>
                      <p className="text-xs text-zinc-500 leading-relaxed">{a.hold.analysis}</p>
                    </div>
                  )}
                  {a.conversion && (
                    <div>
                      <p className="text-xs font-medium text-zinc-400 mb-1">Conversion Analysis</p>
                      <p className="text-xs text-zinc-500 leading-relaxed">{a.conversion.analysis}</p>
                    </div>
                  )}
                </div>
              </SectionCard>
            </div>

            {/* Element Distribution Pie */}
            {a.elements && a.elements.length > 0 && (
              <SectionCard title="Element Distribution">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={a.elements}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="percentage"
                        nameKey="name"
                      >
                        {a.elements.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend
                        formatter={(value) => (
                          <span className="text-xs text-zinc-400">{value}</span>
                        )}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#18181B",
                          border: "1px solid #27272A",
                          borderRadius: 8,
                          color: "#FAFAFA",
                          fontSize: 12,
                        }}
                        formatter={(value) => [`${value}%`, ""]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
            )}

            {/* Visual Breakdown Table */}
            {a.visual_breakdown && a.visual_breakdown.length > 0 && (
              <SectionCard title="Visual Breakdown">
                <div className="overflow-hidden rounded-lg border border-[#27272A]">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#27272A] bg-zinc-900/50">
                        <th className="px-4 py-2.5 text-left font-medium text-zinc-500">Element</th>
                        <th className="px-4 py-2.5 text-left font-medium text-zinc-500">Presence</th>
                        <th className="px-4 py-2.5 text-left font-medium text-zinc-500">Impact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {a.visual_breakdown.map((row, i) => (
                        <tr
                          key={i}
                          className={`border-b border-[#27272A]/50 ${i % 2 === 0 ? "" : "bg-zinc-900/20"}`}
                        >
                          <td className="px-4 py-2.5 text-zinc-300">{row.element}</td>
                          <td className={`px-4 py-2.5 font-medium ${PRESENCE_COLORS[row.presence] ?? "text-zinc-400"}`}>
                            {row.presence}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${IMPACT_COLORS[row.impact] ?? IMPACT_COLORS.Low}`}>
                              {row.impact}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            )}
          </div>
        )}

        {/* ── TAB 2: STRATEGY ───────────────────────────────────────── */}
        {activeTab === "strategy" && (
          <div className="space-y-4">
            {a.strategy?.why_it_worked && (
              <SectionCard title="Why It Worked / Failed">
                <p className="text-sm text-zinc-400 leading-relaxed">{a.strategy.why_it_worked}</p>
              </SectionCard>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {a.strategy?.strengths && a.strategy.strengths.length > 0 && (
                <SectionCard title="Strengths">
                  <div className="flex flex-wrap gap-2">
                    {a.strategy.strengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 w-full">
                        <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                        <span className="text-sm text-zinc-300">{s}</span>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}

              {a.strategy?.weaknesses && a.strategy.weaknesses.length > 0 && (
                <SectionCard title="Weaknesses">
                  <div className="space-y-2">
                    {a.strategy.weaknesses.map((w, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                        <span className="text-sm text-zinc-300">{w}</span>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}
            </div>

            {a.strategy?.psychology_principles && a.strategy.psychology_principles.length > 0 && (
              <SectionCard title="Psychology Principles">
                <div className="flex flex-wrap gap-2">
                  {a.strategy.psychology_principles.map((p, i) => (
                    <Pill
                      key={i}
                      text={p}
                      color="bg-violet-500/15 text-violet-400 border border-violet-500/25"
                    />
                  ))}
                </div>
              </SectionCard>
            )}

            {a.strategy?.improvements && a.strategy.improvements.length > 0 && (
              <SectionCard title="Improvements">
                <div className="space-y-2">
                  {a.strategy.improvements.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg bg-zinc-900/50 px-3 py-2.5">
                      <span className="shrink-0 rounded-full bg-[#F97316]/20 px-1.5 py-0.5 text-xs font-bold text-[#F97316]">
                        {i + 1}
                      </span>
                      <span className="text-sm text-zinc-300">{item}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>
        )}

        {/* ── TAB 3: AUDIENCE ───────────────────────────────────────── */}
        {activeTab === "audience" && (
          <div className="space-y-4">
            {a.audience && (
              <>
                {/* Persona Card */}
                <div className="rounded-xl overflow-hidden border border-[#27272A]">
                  <div className="bg-gradient-to-r from-[#F97316]/30 via-[#F97316]/15 to-transparent px-6 py-5 border-b border-[#27272A]">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-[#F97316]/25 border border-[#F97316]/40 flex items-center justify-center">
                        <Users className="h-6 w-6 text-[#F97316]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{a.audience.persona_name || "Unknown Persona"}</h3>
                        <p className="text-xs text-zinc-400">Target Audience Persona</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#18181B] px-6 py-4">
                    <p className="text-sm text-zinc-400 leading-relaxed">{a.audience.persona_description}</p>
                  </div>
                </div>

                {/* Demographics */}
                {a.audience.demographics && (
                  <SectionCard title="Demographics">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(a.audience.demographics).map(([key, val]) => (
                        <div key={key} className="rounded-lg bg-zinc-900/60 border border-[#27272A] p-3">
                          <p className="text-xs text-zinc-500 capitalize mb-1">{key}</p>
                          <p className="text-sm font-semibold text-white">{val}</p>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {a.audience.pain_points && a.audience.pain_points.length > 0 && (
                    <SectionCard title="Pain Points">
                      <div className="flex flex-wrap gap-2">
                        {a.audience.pain_points.map((p, i) => (
                          <Pill key={i} text={p} color="bg-red-500/15 text-red-400 border border-red-500/25" />
                        ))}
                      </div>
                    </SectionCard>
                  )}

                  {a.audience.interests && a.audience.interests.length > 0 && (
                    <SectionCard title="Interests">
                      <div className="flex flex-wrap gap-2">
                        {a.audience.interests.map((interest, i) => (
                          <Pill key={i} text={interest} color="bg-blue-500/15 text-blue-400 border border-blue-500/25" />
                        ))}
                      </div>
                    </SectionCard>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── TAB 4: GROWTH ─────────────────────────────────────────── */}
        {activeTab === "growth" && (
          <div className="space-y-4">
            {a.growth?.ab_tests && a.growth.ab_tests.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">A/B Test Recommendations</h3>
                {a.growth.ab_tests.map((test, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-[#27272A] bg-[#18181B] p-5 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FlaskConical className="h-4 w-4 text-[#F97316]" />
                        <span className="text-sm font-semibold text-white">{test.name}</span>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${IMPACT_COLORS[test.impact] ?? IMPACT_COLORS.Low}`}>
                        {test.impact} Impact
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed pl-6">{test.hypothesis}</p>
                  </div>
                ))}
              </div>
            )}

            {a.growth?.scaling_recommendations && a.growth.scaling_recommendations.length > 0 && (
              <SectionCard title="Scaling Recommendations">
                <div className="space-y-2">
                  {a.growth.scaling_recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg bg-zinc-900/50 px-3 py-2.5">
                      <Zap className="h-4 w-4 shrink-0 text-[#F97316] mt-0.5" />
                      <span className="text-sm text-zinc-300">{rec}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>
        )}

        {/* ── TAB 5: BUILDING BLOCKS ────────────────────────────────── */}
        {activeTab === "building-blocks" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: "Hooks",
                items: a.building_blocks?.hooks,
                color: "bg-orange-500/15 text-orange-400 border border-orange-500/25",
              },
              {
                title: "Angles (EPIC)",
                items: a.building_blocks?.angles,
                color: "bg-violet-500/15 text-violet-400 border border-violet-500/25",
              },
              {
                title: "CTAs",
                items: a.building_blocks?.ctas,
                color: "bg-green-500/15 text-green-400 border border-green-500/25",
              },
              {
                title: "Social Proof",
                items: a.building_blocks?.social_proof,
                color: "bg-blue-500/15 text-blue-400 border border-blue-500/25",
              },
            ].map((block) => (
              <SectionCard key={block.title} title={block.title}>
                {block.items && block.items.length > 0 ? (
                  <div className="space-y-2">
                    {block.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 rounded-lg bg-zinc-900/50 px-3 py-2"
                      >
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-xs font-bold ${block.color}`}>
                          {i + 1}
                        </span>
                        <span className="text-sm text-zinc-300">{item}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-600">No data available.</p>
                )}
              </SectionCard>
            ))}
          </div>
        )}

        {/* ── TAB 6: EMOTIONAL ARC ──────────────────────────────────── */}
        {activeTab === "emotional-arc" && (
          <div className="space-y-4">
            <SectionCard title="Emotional Intensity Arc">
              <p className="text-xs text-zinc-500">
                Estimated viewer emotional journey across the ad runtime — from curiosity to conversion intent.
              </p>
              {a.emotional_arc && a.emotional_arc.length > 0 ? (
                <div className="pt-2">
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart
                      data={a.emotional_arc}
                      margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "#71717A", fontSize: 11 }}
                        axisLine={{ stroke: "#27272A" }}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: "#71717A", fontSize: 11 }}
                        axisLine={{ stroke: "#27272A" }}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#18181B",
                          border: "1px solid #27272A",
                          borderRadius: 8,
                          color: "#FAFAFA",
                          fontSize: 12,
                        }}
                        formatter={(value, _name, props) => [
                          `${value} — ${props.payload?.emotion ?? ""}`,
                          "Intensity",
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="intensity"
                        stroke="#F97316"
                        strokeWidth={2.5}
                        dot={{ fill: "#F97316", r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: "#F97316" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  {/* Emotion Labels */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {a.emotional_arc.map((point, i) => (
                      <div key={i} className="flex items-center gap-1.5 rounded-lg bg-zinc-900/60 border border-[#27272A] px-2.5 py-1.5">
                        <span className="text-xs text-zinc-500">{point.label}</span>
                        <span className="text-xs font-medium text-white">{point.emotion}</span>
                        <span className="text-xs text-[#F97316] font-bold">{point.intensity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-600 pt-2">Emotional arc data not available for this analysis.</p>
              )}
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  );
}
