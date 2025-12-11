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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-clinical-900">Dashboard</h1>
          <p className="text-clinical-500 mt-1">
            Welcome back! Here's an overview of your activity.
          </p>
        </div>
        <Link href="/dashboard/appointments/new" className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          New Appointment
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Appointments"
          value="156"
          change="+12%"
          trend="up"
          icon={<Calendar className="w-5 h-5" />}
        />
        <StatCard
          title="Recordings"
          value="143"
          change="+8%"
          trend="up"
          icon={<FileAudio className="w-5 h-5" />}
        />
        <StatCard
          title="Notes Generated"
          value="128"
          change="+15%"
          trend="up"
          icon={<FileText className="w-5 h-5" />}
        />
        <StatCard
          title="Avg. Processing Time"
          value="2.3 min"
          change="-18%"
          trend="down"
          icon={<Clock className="w-5 h-5" />}
        />
      </div>

      {/* Recent activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent appointments */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-clinical-900">
              Recent Appointments
            </h2>
            <Link
              href="/dashboard/appointments"
              className="text-sm text-dental-600 hover:text-dental-700"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-clinical-50 transition-colors"
              >
                <div className="w-10 h-10 bg-dental-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-dental-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-clinical-900">
                    Patient #{1000 + i}
                  </p>
                  <p className="text-xs text-clinical-500">
                    Today at {9 + i}:00 AM
                  </p>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                  Completed
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent notes */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-clinical-900">
              Recent Notes
            </h2>
            <Link
              href="/dashboard/notes"
              className="text-sm text-dental-600 hover:text-dental-700"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-clinical-50 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-clinical-900">
                    SOAP Note - Patient #{1000 + i}
                  </p>
                  <p className="text-xs text-clinical-500">
                    Generated {i} hour{i > 1 ? "s" : ""} ago
                  </p>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                  Generated
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-clinical-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/dashboard/appointments/new"
            className="flex items-center gap-4 p-4 rounded-lg border border-clinical-200 hover:border-dental-300 hover:bg-dental-50 transition-colors"
          >
            <div className="w-12 h-12 bg-dental-100 rounded-lg flex items-center justify-center">
              <Plus className="w-6 h-6 text-dental-600" />
            </div>
            <div>
              <p className="font-medium text-clinical-900">New Appointment</p>
              <p className="text-sm text-clinical-500">Schedule a visit</p>
            </div>
          </Link>
          <Link
            href="/dashboard/recordings"
            className="flex items-center gap-4 p-4 rounded-lg border border-clinical-200 hover:border-dental-300 hover:bg-dental-50 transition-colors"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileAudio className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-clinical-900">Upload Recording</p>
              <p className="text-sm text-clinical-500">Transcribe audio</p>
            </div>
          </Link>
          <Link
            href="/dashboard/templates"
            className="flex items-center gap-4 p-4 rounded-lg border border-clinical-200 hover:border-dental-300 hover:bg-dental-50 transition-colors"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-clinical-900">Manage Templates</p>
              <p className="text-sm text-clinical-500">Customize formats</p>
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
}: {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ReactNode;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 bg-clinical-100 rounded-lg flex items-center justify-center text-clinical-600">
          {icon}
        </div>
        <div
          className={`flex items-center gap-1 text-sm ${
            trend === "up" ? "text-green-600" : "text-red-600"
          }`}
        >
          <TrendingUp
            className={`w-4 h-4 ${trend === "down" ? "rotate-180" : ""}`}
          />
          {change}
        </div>
      </div>
      <p className="text-2xl font-semibold text-clinical-900">{value}</p>
      <p className="text-sm text-clinical-500 mt-1">{title}</p>
    </div>
  );
}

