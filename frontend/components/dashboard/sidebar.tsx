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
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 bg-clinical-900 lg:block">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-clinical-800">
          <div className="w-9 h-9 bg-dental-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-white">NoteSmith</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-dental-600 text-white"
                    : "text-clinical-300 hover:text-white hover:bg-clinical-800"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-clinical-800">
          <div className="bg-clinical-800/50 rounded-lg p-4">
            <p className="text-sm font-medium text-white mb-1">Need help?</p>
            <p className="text-xs text-clinical-400 mb-3">
              Check out our documentation
            </p>
            <Link
              href="/docs"
              className="text-xs text-dental-400 hover:text-dental-300"
            >
              View documentation →
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}

