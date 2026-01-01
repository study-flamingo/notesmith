"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { Bell, LogOut, Menu, Search, User as UserIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface HeaderProps {
  user: User;
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 h-16 bg-arc-bg/80 backdrop-blur-xl border-b border-arc-border">
      <div className="flex h-full items-center justify-between px-6">
        {/* Mobile menu button */}
        <button className="lg:hidden p-2 text-text-secondary hover:text-text-primary transition-colors duration-200 ease-out">
          <Menu className="w-6 h-6" />
        </button>

        {/* Search */}
        <div className="hidden md:flex items-center flex-1 max-w-md">
          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim transition-colors duration-200 group-focus-within:text-accent-cyan" />
            <input
              type="search"
              placeholder="Search appointments, notes..."
              className="w-full pl-10 pr-4 py-2 bg-arc-surface border border-arc-border rounded-lg text-sm text-text-primary placeholder:text-text-dim transition-all duration-200 ease-out focus:bg-arc-bg focus:border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-cyan/20 hover:border-arc-border-bright"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="p-2 text-text-secondary hover:text-text-primary relative transition-all duration-200 ease-out rounded-lg hover:bg-arc-surface group">
            <Bell className="w-5 h-5 transition-all duration-200 group-hover:drop-shadow-[0_0_6px_rgba(132,243,236,0.5)]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-green rounded-full shadow-glow-green-sm animate-pulse" />
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-arc-surface transition-all duration-200 ease-out"
            >
              <div className="w-8 h-8 bg-accent-cyan/10 rounded-full flex items-center justify-center border border-accent-cyan/20 transition-all duration-200 ease-out group-hover:border-accent-cyan/40">
                <UserIcon className="w-4 h-4 text-accent-cyan" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-text-primary">
                  {user.user_metadata?.full_name || "User"}
                </p>
                <p className="text-xs text-text-dim">{user.email}</p>
              </div>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-arc-surface rounded-lg shadow-xl border border-arc-border py-2 animate-scale-in">
                <div className="px-4 py-2 border-b border-arc-border">
                  <p className="text-sm font-medium text-text-primary">
                    {user.user_metadata?.full_name || "User"}
                  </p>
                  <p className="text-xs text-text-dim">{user.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-text-secondary hover:text-accent-red hover:bg-accent-red/10 transition-all duration-200 ease-out"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
