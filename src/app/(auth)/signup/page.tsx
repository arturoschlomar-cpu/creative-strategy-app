"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F1117] p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FCD202] mb-4">
            <Zap className="h-6 w-6 text-black" fill="black" />
          </div>
          <h1 className="text-xl font-bold text-white">Create your account</h1>
          <p className="mt-1 text-sm text-[#5A6478]">Start building with the 99ads Creative System</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-[#1E2530] bg-[#161B24] p-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#8693A8]">Full Name</label>
            <Input
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-[#1E2530] bg-[#0F1117] text-white placeholder:text-[#5A6478] focus-visible:ring-[#FCD202]/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#8693A8]">Email</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-[#1E2530] bg-[#0F1117] text-white placeholder:text-[#5A6478] focus-visible:ring-[#FCD202]/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#8693A8]">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-[#1E2530] bg-[#0F1117] text-white placeholder:text-[#5A6478] focus-visible:ring-[#FCD202]/30"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FCD202] text-black font-semibold hover:bg-[#FCD202]/90 disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create Account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-[#5A6478]">
          Already have an account?{" "}
          <Link href="/login" className="text-[#FCD202] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
