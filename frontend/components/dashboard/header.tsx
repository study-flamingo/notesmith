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
    <header className="sticky top-0 z-40 h-16 bg-white border-b border-clinical-200">
      <div className="flex h-full items-center justify-between px-6">
        {/* Mobile menu button */}
        <button className="lg:hidden p-2 text-clinical-500 hover:text-clinical-700">
          <Menu className="w-6 h-6" />
        </button>

        {/* Search */}
        <div className="hidden md:flex items-center flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-clinical-400" />
            <input
              type="search"
              placeholder="Search appointments, notes..."
              className="w-full pl-10 pr-4 py-2 bg-clinical-100 border border-transparent rounded-lg text-sm placeholder:text-clinical-400 focus:bg-white focus:border-clinical-300 focus:outline-none"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="p-2 text-clinical-500 hover:text-clinical-700 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-dental-500 rounded-full" />
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-clinical-100 transition-colors"
            >
              <div className="w-8 h-8 bg-dental-100 rounded-full flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-dental-600" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-clinical-900">
                  {user.user_metadata?.full_name || "User"}
                </p>
                <p className="text-xs text-clinical-500">{user.email}</p>
              </div>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-clinical-200 py-2">
                <div className="px-4 py-2 border-b border-clinical-100">
                  <p className="text-sm font-medium text-clinical-900">
                    {user.user_metadata?.full_name || "User"}
                  </p>
                  <p className="text-xs text-clinical-500">{user.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-clinical-600 hover:bg-clinical-50"
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

