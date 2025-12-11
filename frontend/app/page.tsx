import Link from "next/link";
import { FileAudio, FileText, Settings, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dental-950 via-clinical-900 to-dental-900">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-dental-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-semibold text-white">NoteSmith</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-clinical-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="btn btn-primary"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Transform Dental Appointments into{" "}
            <span className="text-dental-400">Clinical Notes</span>
          </h1>
          <p className="text-xl text-clinical-300 mb-12 max-w-2xl mx-auto">
            AI-powered transcription and note generation for dental practices.
            Record appointments, get accurate transcripts, and generate
            professional clinical documentation in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn btn-primary text-lg px-8 py-3">
              Start Free Trial
            </Link>
            <Link
              href="#features"
              className="btn bg-white/10 text-white hover:bg-white/20 text-lg px-8 py-3"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="mt-32 grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<FileAudio className="w-8 h-8" />}
            title="Audio Transcription"
            description="Upload recordings and get accurate transcripts powered by OpenAI Whisper. Supports speaker diarization."
          />
          <FeatureCard
            icon={<Sparkles className="w-8 h-8" />}
            title="AI Analysis"
            description="Automatically extract clinical entities, procedures, findings, and recommendations from your transcripts."
          />
          <FeatureCard
            icon={<FileText className="w-8 h-8" />}
            title="Note Generation"
            description="Generate SOAP, DAP, or custom clinical notes using customizable templates. Export to PDF or DOCX."
          />
        </div>

        {/* HIPAA Badge */}
        <div className="mt-24 text-center">
          <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-6 py-3">
            <Settings className="w-5 h-5 text-dental-400" />
            <span className="text-clinical-300">
              Designed for HIPAA Compliance
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-24">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-clinical-400 text-sm">
              © 2024 NoteSmith. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-clinical-400 hover:text-white text-sm">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-clinical-400 hover:text-white text-sm">
                Terms of Service
              </Link>
              <Link href="/hipaa" className="text-clinical-400 hover:text-white text-sm">
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
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors">
      <div className="w-14 h-14 bg-dental-500/20 rounded-xl flex items-center justify-center text-dental-400 mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-clinical-300">{description}</p>
    </div>
  );
}

