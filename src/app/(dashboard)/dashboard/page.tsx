import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Blocks,
  TrendingUp,
  Upload,
  ArrowUpRight,
  BarChart3,
  Clock,
  Flame,
} from "lucide-react";
import Link from "next/link";

const stats = [
  {
    label: "Active Winners",
    value: "12",
    change: "+3 this week",
    icon: Trophy,
    color: "text-[#FCD202]",
    bg: "bg-[#FCD202]/10",
  },
  {
    label: "Building Blocks",
    value: "48",
    change: "+7 validated",
    icon: Blocks,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    label: "Avg. ROAS",
    value: "3.8x",
    change: "+0.4 vs last month",
    icon: TrendingUp,
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
  {
    label: "Analyses Run",
    value: "134",
    change: "Last 30 days",
    icon: BarChart3,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
];

const recentAnalyses = [
  {
    id: "1",
    title: "Summer Sale UGC v3",
    label: "winner",
    roas: "4.2x",
    spend: "$2,400",
    time: "2h ago",
  },
  {
    id: "2",
    title: "Product Demo — Hook B",
    label: "neutral",
    roas: "2.1x",
    spend: "$800",
    time: "5h ago",
  },
  {
    id: "3",
    title: "Testimonial Carousel",
    label: "loser",
    roas: "0.9x",
    spend: "$350",
    time: "1d ago",
  },
  {
    id: "4",
    title: "Pain Point Hook v1",
    label: "winner",
    roas: "5.1x",
    spend: "$5,200",
    time: "2d ago",
  },
];

const labelColors: Record<string, string> = {
  winner: "bg-[#FCD202]/15 text-[#FCD202] border-[#FCD202]/20",
  loser: "bg-red-500/15 text-red-400 border-red-500/20",
  neutral: "bg-[#2A3140] text-[#8693A8] border-[#1E2530]",
};

export default function DashboardPage() {
  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Welcome back — here's your creative performance overview"
      />
      <div className="p-6 space-y-6">

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-[#1E2530] bg-[#161B24]">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-[#5A6478] font-medium">{stat.label}</p>
                    <p className="mt-1.5 text-2xl font-bold text-white">{stat.value}</p>
                    <p className="mt-1 text-xs text-[#5A6478]">{stat.change}</p>
                  </div>
                  <div className={`rounded-lg p-2.5 ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">

          {/* Portfolio Mix 20/60/20 */}
          <Card className="border-[#1E2530] bg-[#161B24]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-white">
                <Flame className="h-4 w-4 text-[#FCD202]" />
                Portfolio Mix
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-3 h-3 w-full overflow-hidden rounded-full bg-[#1E2530]">
                  <div className="flex h-full">
                    <div className="h-full w-[20%] bg-[#FCD202] rounded-l-full" />
                    <div className="h-full w-[60%] bg-blue-500" />
                    <div className="h-full w-[20%] bg-purple-500 rounded-r-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Top Performers (Scale)", pct: "20%", color: "bg-[#FCD202]", count: "5 ads" },
                    { label: "Active Testing", pct: "60%", color: "bg-blue-500", count: "15 ads" },
                    { label: "New Concepts", pct: "20%", color: "bg-purple-500", count: "5 ads" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${item.color}`} />
                        <span className="text-[#8693A8]">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#5A6478]">{item.count}</span>
                        <span className="font-semibold text-white">{item.pct}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card className="border-[#1E2530] bg-[#161B24]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { href: "/analyze", label: "Upload & Analyze Ad", icon: Upload, primary: true },
                { href: "/scripts", label: "Generate Script", icon: Clock, primary: false },
                { href: "/framework", label: "View 3A Framework", icon: BarChart3, primary: false },
                { href: "/chat", label: "Open AI Chat", icon: ArrowUpRight, primary: false },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all ${
                    action.primary
                      ? "bg-[#FCD202] text-black hover:bg-[#FCD202]/90"
                      : "border border-[#1E2530] text-[#8693A8] hover:border-[#2A3140] hover:bg-[#1E2530] hover:text-white"
                  }`}
                >
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* 3A Framework summary */}
          <Card className="border-[#1E2530] bg-[#161B24]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white">3A Framework Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Attract (Hook)", score: 78, color: "bg-[#FCD202]" },
                { label: "Absorb (Hold)", score: 64, color: "bg-blue-500" },
                { label: "Act (Convert)", score: 52, color: "bg-purple-500" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-[#8693A8]">{item.label}</span>
                    <span className="font-semibold text-white">{item.score}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[#1E2530]">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
              <Link
                href="/framework"
                className="mt-2 flex items-center gap-1 text-xs text-[#FCD202] hover:underline"
              >
                View full framework
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent analyses */}
        <Card className="border-[#1E2530] bg-[#161B24]">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold text-white">Recent Analyses</CardTitle>
            <Link
              href="/library"
              className="flex items-center gap-1 text-xs text-[#FCD202] hover:underline"
            >
              View all
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-md border border-[#1E2530]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1E2530] bg-[#0F1117]">
                    {["Creative", "Label", "ROAS", "Spend", "Analyzed"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-[#5A6478]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentAnalyses.map((ad, i) => (
                    <tr
                      key={ad.id}
                      className={`border-b border-[#1E2530] transition-colors hover:bg-[#1E2530]/50 ${
                        i === recentAnalyses.length - 1 ? "border-0" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <Link href={`/analyze/${ad.id}`} className="font-medium text-white hover:text-[#FCD202]">
                          {ad.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`border text-[10px] capitalize ${labelColors[ad.label]}`}>
                          {ad.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium text-white">{ad.roas}</td>
                      <td className="px-4 py-3 text-[#8693A8]">{ad.spend}</td>
                      <td className="px-4 py-3 text-[#5A6478]">{ad.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
