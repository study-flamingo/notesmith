<<<<<<< Updated upstream
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  FileAudio,
  FileText,
  LayoutTemplate,
  Settings,
  Sparkles,
  Home,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Appointments", href: "/dashboard/appointments", icon: Calendar },
  { name: "Recordings", href: "/dashboard/recordings", icon: FileAudio },
  { name: "Notes", href: "/dashboard/notes", icon: FileText },
  { name: "Templates", href: "/dashboard/templates", icon: LayoutTemplate },
  { name: "Agent", href: "/dashboard/agent", icon: Bot },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 bg-arc-bg border-r border-arc-border lg:block">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-arc-border">
          <div className="w-9 h-9 bg-accent-green rounded-lg flex items-center justify-center shadow-glow-green-sm transition-all duration-300 ease-out hover:shadow-glow-green">
            <Sparkles className="w-5 h-5 text-arc-bg" />
          </div>
          <span className="text-lg font-semibold text-text-primary">NoteSmith</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 animate-stagger">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                  "transition-all duration-200 ease-out",
                  isActive
                    ? "bg-accent-green/10 text-accent-green shadow-[inset_0_0_20px_rgba(46,243,138,0.08)]"
                    : "text-text-secondary hover:text-text-primary hover:bg-arc-surface"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-all duration-200 ease-out",
                    isActive && "drop-shadow-[0_0_6px_rgba(46,243,138,0.5)]"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-arc-border">
          <div className="bg-arc-surface rounded-lg p-4 border border-arc-border transition-all duration-300 ease-out hover:border-arc-border-bright">
            <p className="text-sm font-medium text-text-primary mb-1">Need help?</p>
            <p className="text-xs text-text-dim mb-3">
              Check out our documentation
            </p>
            <Link
              href="/docs"
              className="text-xs text-accent-cyan hover:text-accent-cyan transition-all duration-200 ease-out hover:drop-shadow-[0_0_6px_rgba(132,243,236,0.5)]"
            >
              View documentation →
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
=======
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  FileAudio,
  FileText,
  LayoutTemplate,
  Settings,
  Sparkles,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Appointments", href: "/dashboard/appointments", icon: Calendar },
  { name: "Recordings", href: "/dashboard/recordings", icon: FileAudio },
  { name: "Notes", href: "/dashboard/notes", icon: FileText },
  { name: "Templates", href: "/dashboard/templates", icon: LayoutTemplate },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 bg-arc-bg border-r border-arc-border lg:block">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-arc-border">
          <div className="w-9 h-9 bg-accent-green rounded-lg flex items-center justify-center shadow-glow-green-sm transition-all duration-300 ease-out hover:shadow-glow-green">
            <Sparkles className="w-5 h-5 text-arc-bg" />
          </div>
          <span className="text-lg font-semibold text-text-primary">NoteSmith</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 animate-stagger">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                  "transition-all duration-200 ease-out",
                  isActive
                    ? "bg-accent-green/10 text-accent-green shadow-[inset_0_0_20px_rgba(46,243,138,0.08)]"
                    : "text-text-secondary hover:text-text-primary hover:bg-arc-surface"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-all duration-200 ease-out",
                    isActive && "drop-shadow-[0_0_6px_rgba(46,243,138,0.5)]"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-arc-border">
          <div className="bg-arc-surface rounded-lg p-4 border border-arc-border transition-all duration-300 ease-out hover:border-arc-border-bright">
            <p className="text-sm font-medium text-text-primary mb-1">Need help?</p>
            <p className="text-xs text-text-dim mb-3">
              Check out our documentation
            </p>
            <Link
              href="/docs"
              className="text-xs text-accent-cyan hover:text-accent-cyan transition-all duration-200 ease-out hover:drop-shadow-[0_0_6px_rgba(132,243,236,0.5)]"
            >
              View documentation →
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
>>>>>>> Stashed changes
