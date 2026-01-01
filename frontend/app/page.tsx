import Link from "next/link";
import { FileAudio, FileText, Shield, Sparkles, Zap, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-arc-bg relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-accent-green/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-accent-cyan/5 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-yellow/3 rounded-full blur-3xl" />
      
      {/* Header */}
      <header className="relative z-10 border-b border-arc-border backdrop-blur-xl bg-arc-bg/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-accent-green rounded-xl flex items-center justify-center shadow-glow-green-sm transition-all duration-300 group-hover:shadow-glow-green">
              <Sparkles className="w-6 h-6 text-arc-bg" />
            </div>
            <span className="text-xl font-semibold text-text-primary">NoteSmith</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-text-secondary hover:text-text-primary transition-all duration-200 ease-out"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="btn btn-glow-green"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-6 py-24">
        <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-accent-cyan/10 border border-accent-cyan/20 rounded-full px-4 py-1.5 mb-8">
            <Zap className="w-4 h-4 text-accent-cyan" />
            <span className="text-sm text-accent-cyan">AI-Powered Clinical Documentation</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-text-primary mb-6 leading-tight">
            Transform Dental Appointments into{" "}
            <span className="text-accent-green text-glow-sm">Clinical Notes</span>
          </h1>
          <p className="text-xl text-text-secondary mb-12 max-w-2xl mx-auto">
            AI-powered transcription and note generation for dental practices.
            Record appointments, get accurate transcripts, and generate
            professional clinical documentation in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn btn-glow-green text-lg px-8 py-3 group">
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              href="#features"
              className="btn btn-secondary text-lg px-8 py-3"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="mt-32 grid md:grid-cols-3 gap-8 animate-stagger">
          <FeatureCard
            icon={<FileAudio className="w-8 h-8" />}
            title="Audio Transcription"
            description="Upload recordings and get accurate transcripts powered by OpenAI Whisper. Supports speaker diarization."
            color="cyan"
          />
          <FeatureCard
            icon={<Sparkles className="w-8 h-8" />}
            title="AI Analysis"
            description="Automatically extract clinical entities, procedures, findings, and recommendations from your transcripts."
            color="green"
          />
          <FeatureCard
            icon={<FileText className="w-8 h-8" />}
            title="Note Generation"
            description="Generate SOAP, DAP, or custom clinical notes using customizable templates. Export to PDF or DOCX."
            color="yellow"
          />
        </div>

        {/* HIPAA Badge */}
        <div className="mt-24 text-center">
          <div className="inline-flex items-center gap-3 bg-arc-surface border border-arc-border rounded-full px-6 py-3 transition-all duration-300 hover:border-arc-border-bright hover:shadow-lg">
            <Shield className="w-5 h-5 text-accent-cyan" />
            <span className="text-text-secondary">
              Designed for <span className="text-accent-cyan font-medium">HIPAA Compliance</span>
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-arc-border mt-24 backdrop-blur-xl bg-arc-bg/50">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-text-dim text-sm">
              © 2024 NoteSmith. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-text-dim hover:text-text-secondary text-sm transition-colors duration-200">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-text-dim hover:text-text-secondary text-sm transition-colors duration-200">
                Terms of Service
              </Link>
              <Link href="/hipaa" className="text-text-dim hover:text-text-secondary text-sm transition-colors duration-200">
                HIPAA Compliance
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: "green" | "cyan" | "yellow";
}) {
  const colorClasses = {
    green: {
      bg: "bg-accent-green/10",
      border: "border-accent-green/20",
      text: "text-accent-green",
      hoverGlow: "group-hover:shadow-glow-green-sm",
      hoverBorder: "hover:border-accent-green/30",
    },
    cyan: {
      bg: "bg-accent-cyan/10",
      border: "border-accent-cyan/20",
      text: "text-accent-cyan",
      hoverGlow: "group-hover:shadow-glow-cyan-sm",
      hoverBorder: "hover:border-accent-cyan/30",
    },
    yellow: {
      bg: "bg-accent-yellow/10",
      border: "border-accent-yellow/20",
      text: "text-accent-yellow",
      hoverGlow: "group-hover:shadow-glow-yellow-sm",
      hoverBorder: "hover:border-accent-yellow/30",
    },
  };

  const c = colorClasses[color];

  return (
    <div className={`group bg-arc-surface border border-arc-border rounded-2xl p-8 transition-all duration-300 ease-out ${c.hoverBorder} hover:translate-y-[-4px] hover:shadow-xl`}>
      <div className={`w-14 h-14 ${c.bg} ${c.border} border rounded-xl flex items-center justify-center ${c.text} mb-6 transition-all duration-300 ${c.hoverGlow}`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-text-primary mb-3">{title}</h3>
      <p className="text-text-secondary">{description}</p>
    </div>
  );
}
