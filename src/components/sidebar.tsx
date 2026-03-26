"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  FolderOpen,
  FileText,
  ClipboardList,
  Blocks,
  Layers,
  FlaskConical,
  Package,
  MessageCircle,
  Settings,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analyze", label: "Analyze", icon: Upload },
  { href: "/library", label: "Ad Library", icon: FolderOpen },
  { href: "/scripts", label: "Scripts", icon: FileText },
  { href: "/briefs", label: "Briefs", icon: ClipboardList },
  { href: "/building-blocks", label: "Building Blocks", icon: Blocks },
  { href: "/framework", label: "3A Framework", icon: Layers },
  { href: "/testing", label: "Testing", icon: FlaskConical },
  { href: "/products", label: "Products", icon: Package },
  { href: "/chat", label: "AI Chat", icon: MessageCircle },
];

const bottomItems = [
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-[#1E2530] bg-[#090B0F]">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-[#1E2530] px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FCD202]">
          <Zap className="h-4 w-4 text-black" fill="black" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">CreativeOS</p>
          <p className="text-[10px] text-[#5A6478]">99ads Winning System</p>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
                    active
                      ? "bg-[#FCD202]/10 text-[#FCD202]"
                      : "text-[#8693A8] hover:bg-[#1E2530] hover:text-white"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 flex-shrink-0 transition-colors",
                      active
                        ? "text-[#FCD202]"
                        : "text-[#5A6478] group-hover:text-white"
                    )}
                  />
                  {label}
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#FCD202]" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom nav */}
      <div className="border-t border-[#1E2530] px-3 py-3">
        {bottomItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-[#FCD202]/10 text-[#FCD202]"
                  : "text-[#8693A8] hover:bg-[#1E2530] hover:text-white"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 flex-shrink-0",
                  active ? "text-[#FCD202]" : "text-[#5A6478] group-hover:text-white"
                )}
              />
              {label}
            </Link>
          );
        })}

        {/* User avatar placeholder */}
        <div className="mt-2 flex items-center gap-3 rounded-md px-3 py-2">
          <div className="h-7 w-7 rounded-full bg-[#FCD202]/20 flex items-center justify-center">
            <span className="text-xs font-semibold text-[#FCD202]">U</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-white">User</p>
            <p className="truncate text-[10px] text-[#5A6478]">user@example.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
