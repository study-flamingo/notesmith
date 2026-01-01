"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user && !data.session) {
      setEmailSent(true);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-arc-bg flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent-cyan/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent-green/10 rounded-full blur-3xl" />
        
        <div className="w-full max-w-md relative z-10 animate-fade-in-up">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-accent-green rounded-xl flex items-center justify-center shadow-glow-green">
              <Sparkles className="w-7 h-7 text-arc-bg" />
            </div>
            <span className="text-2xl font-semibold text-text-primary">NoteSmith</span>
          </div>

          {/* Success Card */}
          <div className="bg-arc-surface rounded-2xl border border-arc-border shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-accent-cyan/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-accent-cyan/20 shadow-glow-cyan-sm">
              <Mail className="w-8 h-8 text-accent-cyan" />
            </div>
            <h1 className="text-2xl font-semibold text-text-primary mb-2">
              Check your email
            </h1>
            <p className="text-text-secondary mb-6">
              We&apos;ve sent a confirmation link to <strong className="text-text-primary">{email}</strong>. 
              Click the link in your email to activate your account.
            </p>
            <p className="text-sm text-text-dim mb-6">
              Didn&apos;t receive the email? Check your spam folder or try again.
            </p>
            <Link
              href="/login"
              className="btn btn-glow-green w-full py-3 inline-block"
            >
              Go to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-arc-bg flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent-cyan/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent-green/10 rounded-full blur-3xl" />
      
      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-accent-green rounded-xl flex items-center justify-center shadow-glow-green transition-all duration-300 hover:shadow-glow-green">
            <Sparkles className="w-7 h-7 text-arc-bg" />
          </div>
          <span className="text-2xl font-semibold text-text-primary">NoteSmith</span>
        </div>

        {/* Form Card */}
        <div className="bg-arc-surface rounded-2xl border border-arc-border shadow-xl p-8">
          <h1 className="text-2xl font-semibold text-text-primary mb-2">
            Create an account
          </h1>
          <p className="text-text-secondary mb-8">
            Start your free trial today
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-accent-red/10 border border-accent-red/30 text-accent-red px-4 py-3 rounded-lg text-sm animate-fade-in">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="label block mb-2">
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input"
                placeholder="Dr. Jane Smith"
                required
              />
            </div>

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
                minLength={8}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label block mb-2">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                required
                className="mt-1 w-4 h-4 rounded border-arc-border bg-arc-bg text-accent-green focus:ring-accent-green/50 focus:ring-offset-arc-bg"
              />
              <label htmlFor="terms" className="text-sm text-text-secondary">
                I agree to the{" "}
                <Link href="/terms" className="text-accent-cyan hover:text-accent-cyan transition-all duration-200 hover:drop-shadow-[0_0_6px_rgba(132,243,236,0.5)]">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-accent-cyan hover:text-accent-cyan transition-all duration-200 hover:drop-shadow-[0_0_6px_rgba(132,243,236,0.5)]">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-glow-green w-full py-3"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-accent-green hover:text-accent-green font-medium transition-all duration-200 hover:drop-shadow-[0_0_6px_rgba(46,243,138,0.5)]"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
