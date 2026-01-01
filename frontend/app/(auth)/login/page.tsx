"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message === "Invalid login credentials") {
        setError("Invalid email or password. If you just registered, please check your email to confirm your account first.");
      } else {
        setError(error.message);
      }
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-arc-bg flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent-green/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent-cyan/10 rounded-full blur-3xl" />
      
      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-accent-green rounded-xl flex items-center justify-center shadow-glow-green transition-all duration-300 hover:shadow-glow-green">
            <Sparkles className="w-7 h-7 text-arc-bg" />
          </div>
          <span className="text-2xl font-semibold text-text-primary">NoteSmith</span>
        </div>

        {/* Form Card */}
        <div className="bg-arc-surface rounded-2xl border border-arc-border shadow-xl p-8 backdrop-blur-xl">
          <h1 className="text-2xl font-semibold text-text-primary mb-2">
            Welcome back
          </h1>
          <p className="text-text-secondary mb-8">
            Sign in to your account to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-accent-red/10 border border-accent-red/30 text-accent-red px-4 py-3 rounded-lg text-sm animate-fade-in">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="label block mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="label block mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-arc-border bg-arc-bg text-accent-green focus:ring-accent-green/50 focus:ring-offset-arc-bg"
                />
                <span className="text-sm text-text-secondary">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-accent-cyan hover:text-accent-cyan transition-all duration-200 hover:drop-shadow-[0_0_6px_rgba(132,243,236,0.5)]"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-glow-green w-full py-3"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-accent-green hover:text-accent-green font-medium transition-all duration-200 hover:drop-shadow-[0_0_6px_rgba(46,243,138,0.5)]"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
