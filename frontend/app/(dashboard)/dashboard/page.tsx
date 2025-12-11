import Link from "next/link";
import {
  Calendar,
  FileAudio,
  FileText,
  Plus,
  TrendingUp,
  Clock,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Dashboard</h1>
          <p className="text-text-secondary mt-1">
            Welcome back! Here&apos;s an overview of your activity.
          </p>
        </div>
        <Link href="/dashboard/appointments/new" className="btn btn-glow-green">
          <Plus className="w-4 h-4 mr-2" />
          New Appointment
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-stagger">
        <StatCard
          title="Total Appointments"
          value="156"
          change="+12%"
          trend="up"
          icon={<Calendar className="w-5 h-5" />}
          color="cyan"
        />
        <StatCard
          title="Recordings"
          value="143"
          change="+8%"
          trend="up"
          icon={<FileAudio className="w-5 h-5" />}
          color="yellow"
        />
        <StatCard
          title="Notes Generated"
          value="128"
          change="+15%"
          trend="up"
          icon={<FileText className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Avg. Processing Time"
          value="2.3 min"
          change="-18%"
          trend="down"
          icon={<Clock className="w-5 h-5" />}
          color="red"
        />
      </div>

      {/* Recent activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent appointments */}
        <div className="card-hover p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-text-primary">
              Recent Appointments
            </h2>
            <Link
              href="/dashboard/appointments"
              className="text-sm text-accent-cyan hover:text-accent-cyan transition-all duration-200 hover:drop-shadow-[0_0_6px_rgba(132,243,236,0.5)]"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-arc-surface-hover transition-all duration-200 ease-out cursor-pointer group"
              >
                <div className="w-10 h-10 bg-accent-cyan/10 rounded-lg flex items-center justify-center border border-accent-cyan/20 transition-all duration-200 group-hover:border-accent-cyan/40 group-hover:shadow-glow-cyan-sm">
                  <Calendar className="w-5 h-5 text-accent-cyan" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">
                    Patient #{1000 + i}
                  </p>
                  <p className="text-xs text-text-dim">
                    Today at {9 + i}:00 AM
                  </p>
                </div>
                <span className="badge badge-green">
                  Completed
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent notes */}
        <div className="card-hover p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-text-primary">
              Recent Notes
            </h2>
            <Link
              href="/dashboard/notes"
              className="text-sm text-accent-cyan hover:text-accent-cyan transition-all duration-200 hover:drop-shadow-[0_0_6px_rgba(132,243,236,0.5)]"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-arc-surface-hover transition-all duration-200 ease-out cursor-pointer group"
              >
                <div className="w-10 h-10 bg-accent-yellow/10 rounded-lg flex items-center justify-center border border-accent-yellow/20 transition-all duration-200 group-hover:border-accent-yellow/40 group-hover:shadow-glow-yellow-sm">
                  <FileText className="w-5 h-5 text-accent-yellow" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">
                    SOAP Note - Patient #{1000 + i}
                  </p>
                  <p className="text-xs text-text-dim">
                    Generated {i} hour{i > 1 ? "s" : ""} ago
                  </p>
                </div>
                <span className="badge badge-yellow">
                  Generated
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/dashboard/appointments/new"
            className="flex items-center gap-4 p-4 rounded-lg border border-arc-border hover:border-accent-green/30 hover:bg-accent-green/5 transition-all duration-200 ease-out group"
          >
            <div className="w-12 h-12 bg-accent-green/10 rounded-lg flex items-center justify-center border border-accent-green/20 transition-all duration-200 group-hover:shadow-glow-green-sm group-hover:border-accent-green/40">
              <Plus className="w-6 h-6 text-accent-green" />
            </div>
            <div>
              <p className="font-medium text-text-primary">New Appointment</p>
              <p className="text-sm text-text-dim">Schedule a visit</p>
            </div>
          </Link>
          <Link
            href="/dashboard/recordings"
            className="flex items-center gap-4 p-4 rounded-lg border border-arc-border hover:border-accent-cyan/30 hover:bg-accent-cyan/5 transition-all duration-200 ease-out group"
          >
            <div className="w-12 h-12 bg-accent-cyan/10 rounded-lg flex items-center justify-center border border-accent-cyan/20 transition-all duration-200 group-hover:shadow-glow-cyan-sm group-hover:border-accent-cyan/40">
              <FileAudio className="w-6 h-6 text-accent-cyan" />
            </div>
            <div>
              <p className="font-medium text-text-primary">Upload Recording</p>
              <p className="text-sm text-text-dim">Transcribe audio</p>
            </div>
          </Link>
          <Link
            href="/dashboard/templates"
            className="flex items-center gap-4 p-4 rounded-lg border border-arc-border hover:border-accent-yellow/30 hover:bg-accent-yellow/5 transition-all duration-200 ease-out group"
          >
            <div className="w-12 h-12 bg-accent-yellow/10 rounded-lg flex items-center justify-center border border-accent-yellow/20 transition-all duration-200 group-hover:shadow-glow-yellow-sm group-hover:border-accent-yellow/40">
              <FileText className="w-6 h-6 text-accent-yellow" />
            </div>
            <div>
              <p className="font-medium text-text-primary">Manage Templates</p>
              <p className="text-sm text-text-dim">Customize formats</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
  trend,
  icon,
  color,
}: {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ReactNode;
  color: "green" | "cyan" | "yellow" | "red";
}) {
  const colorClasses = {
    green: {
      bg: "bg-accent-green/10",
      border: "border-accent-green/20",
      text: "text-accent-green",
      glow: "group-hover:shadow-glow-green-sm",
    },
    cyan: {
      bg: "bg-accent-cyan/10",
      border: "border-accent-cyan/20",
      text: "text-accent-cyan",
      glow: "group-hover:shadow-glow-cyan-sm",
    },
    yellow: {
      bg: "bg-accent-yellow/10",
      border: "border-accent-yellow/20",
      text: "text-accent-yellow",
      glow: "group-hover:shadow-glow-yellow-sm",
    },
    red: {
      bg: "bg-accent-red/10",
      border: "border-accent-red/20",
      text: "text-accent-red",
      glow: "group-hover:shadow-glow-red-sm",
    },
  };

  const c = colorClasses[color];

  return (
    <div className="card-hover p-6 group">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 ${c.bg} rounded-lg flex items-center justify-center border ${c.border} ${c.text} transition-all duration-200 ${c.glow}`}>
          {icon}
        </div>
        <div
          className={`flex items-center gap-1 text-sm font-medium ${
            trend === "up" ? "text-accent-green" : "text-accent-red"
          }`}
        >
          <TrendingUp
            className={`w-4 h-4 ${trend === "down" ? "rotate-180" : ""}`}
          />
          {change}
        </div>
      </div>
      <p className="text-2xl font-semibold text-text-primary">{value}</p>
      <p className="text-sm text-text-secondary mt-1">{title}</p>
    </div>
  );
}
