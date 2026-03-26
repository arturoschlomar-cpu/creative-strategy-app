"use client";

import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-[#1E2530] bg-[#090B0F] px-6">
      <div>
        <h1 className="text-base font-semibold text-white">{title}</h1>
        {subtitle && (
          <p className="text-xs text-[#5A6478]">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#5A6478]" />
          <Input
            placeholder="Search..."
            className="h-8 w-56 rounded-md border-[#1E2530] bg-[#161B24] pl-8 text-xs text-white placeholder:text-[#5A6478] focus-visible:ring-[#FCD202]/30"
          />
        </div>
        <button className="relative rounded-md p-2 text-[#5A6478] hover:bg-[#1E2530] hover:text-white transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#FCD202]" />
        </button>
      </div>
    </header>
  );
}
