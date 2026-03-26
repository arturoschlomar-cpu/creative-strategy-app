import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <>
      <Header title="Settings" subtitle="Manage your account and integrations" />
      <div className="max-w-2xl p-6 space-y-5">
        <Card className="border-[#1E2530] bg-[#161B24]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Full Name", placeholder: "Your name" },
              { label: "Email", placeholder: "you@example.com" },
            ].map((f) => (
              <div key={f.label}>
                <label className="mb-1.5 block text-xs font-medium text-[#8693A8]">{f.label}</label>
                <Input
                  placeholder={f.placeholder}
                  className="border-[#1E2530] bg-[#0F1117] text-white placeholder:text-[#5A6478] focus-visible:ring-[#FCD202]/30"
                />
              </div>
            ))}
            <Button className="bg-[#FCD202] text-black hover:bg-[#FCD202]/90 h-8 text-xs font-semibold">
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card className="border-[#1E2530] bg-[#161B24]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white">API Integrations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Gemini API Key", placeholder: "AIza..." },
              { label: "Meta Ads Token", placeholder: "EAAx..." },
            ].map((f) => (
              <div key={f.label}>
                <label className="mb-1.5 block text-xs font-medium text-[#8693A8]">{f.label}</label>
                <Input
                  type="password"
                  placeholder={f.placeholder}
                  className="border-[#1E2530] bg-[#0F1117] text-white placeholder:text-[#5A6478] focus-visible:ring-[#FCD202]/30"
                />
              </div>
            ))}
            <Button className="bg-[#FCD202] text-black hover:bg-[#FCD202]/90 h-8 text-xs font-semibold">
              Save Keys
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
