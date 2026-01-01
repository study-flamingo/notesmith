"use client";

import { useState, useEffect } from "react";
import {
  Bot,
  Activity,
  Save,
  RotateCcw,
  FileText,
  Calendar,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "settings" | "activity";

type ActivityLog = {
  id: string;
  timestamp: string;
  action: string;
  resourceType: string;
  resourceId: string;
  userId: string;
  success: boolean;
  details?: Record<string, any>;
};

type ActivityFilter = "all" | "success" | "error";

const DEFAULT_SYSTEM_PROMPT = `You are an AI assistant specialized in dental clinical documentation. Your role is to:

1. Analyze appointment transcripts accurately and thoroughly
2. Extract relevant clinical information (procedures, findings, diagnoses, treatment plans)
3. Generate professional clinical notes following standard templates (SOAP, DAP, Narrative)
4. Maintain HIPAA compliance and patient privacy
5. Use appropriate dental terminology and ICD/CDT codes when applicable

Be concise, accurate, and professional in all generated content.`;

// Mock activity data - TODO: Replace with real API
const mockActivityLogs: ActivityLog[] = [
  {
    id: "1",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    action: "generate",
    resourceType: "note",
    resourceId: "note_123",
    userId: "user_456",
    success: true,
    details: { template: "SOAP", duration_ms: 1234 },
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    action: "analyze",
    resourceType: "transcript",
    resourceId: "trans_789",
    userId: "user_456",
    success: true,
    details: { entities_found: 15, confidence: 0.92 },
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    action: "generate",
    resourceType: "note",
    resourceId: "note_124",
    userId: "user_456",
    success: false,
    details: { error: "Token limit exceeded", template: "DAP" },
  },
  {
    id: "4",
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    action: "transcribe",
    resourceType: "recording",
    resourceId: "rec_555",
    userId: "user_456",
    success: true,
    details: { duration_seconds: 180, words: 450 },
  },
  {
    id: "5",
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    action: "generate",
    resourceType: "note",
    resourceId: "note_125",
    userId: "user_456",
    success: true,
    details: { template: "Narrative", duration_ms: 2100 },
  },
];

export default function AgentPage() {
  const [activeTab, setActiveTab] = useState<Tab>("settings");
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const [loadingActivity, setLoadingActivity] = useState(false);

  // Load activity logs when tab switches
  useEffect(() => {
    if (activeTab === "activity" && activityLogs.length === 0) {
      loadActivityLogs();
    }
  }, [activeTab]);

  const loadActivityLogs = async () => {
    setLoadingActivity(true);
    // TODO: Replace with real API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setActivityLogs(mockActivityLogs);
    setLoadingActivity(false);
  };

  const handlePromptChange = (value: string) => {
    setSystemPrompt(value);
    setHasChanges(value !== DEFAULT_SYSTEM_PROMPT);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Implement API call to save system prompt
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setHasChanges(false);
  };

  const handleReset = () => {
    setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
    setHasChanges(false);
  };

  const filteredLogs = activityLogs.filter((log) => {
    if (activityFilter === "all") return true;
    if (activityFilter === "success") return log.success;
    if (activityFilter === "error") return !log.success;
    return true;
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "generate":
        return FileText;
      case "analyze":
        return Activity;
      case "transcribe":
        return FileText;
      default:
        return AlertCircle;
    }
  };

  const getResourceTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      note: "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20",
      transcript: "bg-accent-green/10 text-accent-green border border-accent-green/20",
      recording: "bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/20",
      template: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    };
    return colors[type] || "bg-clinical-800/50 text-clinical-200 border border-clinical-700";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-clinical-50">AI Agent</h1>
        <p className="text-clinical-400 mt-1">
          Configure AI behavior and monitor activity
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-arc-border">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("settings")}
            className={cn(
              "flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors",
              activeTab === "settings"
                ? "border-accent-green text-accent-green"
                : "border-transparent text-clinical-400 hover:text-clinical-200 hover:border-clinical-700"
            )}
          >
            <Bot className="w-4 h-4" />
            Settings
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={cn(
              "flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors",
              activeTab === "activity"
                ? "border-accent-green text-accent-green"
                : "border-transparent text-clinical-400 hover:text-clinical-200 hover:border-clinical-700"
            )}
          >
            <Activity className="w-4 h-4" />
            Activity Log
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          {/* AI Provider Info */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-clinical-50 mb-4">
              AI Provider
            </h2>
            <div className="space-y-4">
              <div>
                <label className="label">Current Provider</label>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-arc-surface-hover px-4 py-2 rounded-lg border border-arc-border">
                    <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse"></div>
                    <span className="text-clinical-200 font-medium">OpenAI GPT-4</span>
                  </div>
                  <span className="text-xs text-clinical-500">
                    Configured in backend settings
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* System Prompt Configuration */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-clinical-50">
                  System Prompt
                </h2>
                <p className="text-sm text-clinical-400 mt-1">
                  Customize how the AI interprets and generates clinical notes
                </p>
              </div>
              {hasChanges && (
                <span className="px-2 py-1 text-xs font-medium bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/20 rounded-full">
                  Unsaved Changes
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => handlePromptChange(e.target.value)}
                  rows={12}
                  className="w-full rounded-lg border border-arc-border bg-arc-bg px-4 py-3 text-sm text-clinical-100 placeholder:text-clinical-600 transition-all duration-200 ease-out focus:border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-cyan/20 hover:border-arc-border-bright font-mono"
                  placeholder="Enter custom system prompt..."
                />
                <p className="mt-2 text-xs text-clinical-500">
                  {systemPrompt.length} characters
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className="btn btn-primary"
                >
                  {isSaving ? (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Prompt
                    </>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  disabled={!hasChanges}
                  className="btn btn-secondary"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset to Default
                </button>
              </div>
            </div>
          </div>

          {/* Best Practices */}
          <div className="card p-6 bg-accent-cyan/5 border-accent-cyan/20">
            <h3 className="text-sm font-semibold text-clinical-50 mb-3">
              💡 Best Practices
            </h3>
            <ul className="space-y-2 text-sm text-clinical-300">
              <li className="flex items-start gap-2">
                <span className="text-accent-cyan mt-0.5">•</span>
                <span>Be specific about the AI's role and expertise domain</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-cyan mt-0.5">•</span>
                <span>Include instructions for HIPAA compliance and privacy</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-cyan mt-0.5">•</span>
                <span>Specify output format and terminology preferences</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-cyan mt-0.5">•</span>
                <span>Test changes with sample transcripts before production use</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === "activity" && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-clinical-400" />
                <span className="text-sm font-medium text-clinical-200">Filter:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActivityFilter("all")}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-full transition-all",
                      activityFilter === "all"
                        ? "bg-accent-green/10 text-accent-green border border-accent-green/20"
                        : "bg-arc-surface-hover text-clinical-400 border border-arc-border hover:text-clinical-200"
                    )}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActivityFilter("success")}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-full transition-all",
                      activityFilter === "success"
                        ? "bg-accent-green/10 text-accent-green border border-accent-green/20"
                        : "bg-arc-surface-hover text-clinical-400 border border-arc-border hover:text-clinical-200"
                    )}
                  >
                    Success
                  </button>
                  <button
                    onClick={() => setActivityFilter("error")}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-full transition-all",
                      activityFilter === "error"
                        ? "bg-accent-red/10 text-accent-red border border-accent-red/20"
                        : "bg-arc-surface-hover text-clinical-400 border border-arc-border hover:text-clinical-200"
                    )}
                  >
                    Errors
                  </button>
                </div>
              </div>
              <button
                onClick={loadActivityLogs}
                disabled={loadingActivity}
                className="text-sm text-clinical-400 hover:text-clinical-200 flex items-center gap-2"
              >
                <RotateCcw className={cn("w-4 h-4", loadingActivity && "animate-spin")} />
                Refresh
              </button>
            </div>
          </div>

          {/* Activity Log */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-clinical-50 mb-4">
              Activity Log
            </h2>

            {loadingActivity ? (
              <div className="text-center py-12">
                <RotateCcw className="w-8 h-8 text-clinical-500 mx-auto mb-4 animate-spin" />
                <p className="text-clinical-400">Loading activity...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-clinical-500 mx-auto mb-4" />
                <p className="text-clinical-400">No activity found</p>
                <p className="text-sm text-clinical-500 mt-2">
                  {activityFilter !== "all"
                    ? `No ${activityFilter} events found`
                    : "Activity will appear here as the AI agent processes data"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log) => {
                  const ActionIcon = getActionIcon(log.action);
                  return (
                    <div
                      key={log.id}
                      className={cn(
                        "p-4 rounded-lg border transition-all",
                        log.success
                          ? "bg-arc-surface border-arc-border hover:border-arc-border-bright"
                          : "bg-accent-red/5 border-accent-red/20 hover:border-accent-red/30"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center",
                              log.success
                                ? "bg-arc-surface-hover"
                                : "bg-accent-red/10"
                            )}
                          >
                            <ActionIcon
                              className={cn(
                                "w-4 h-4",
                                log.success ? "text-clinical-300" : "text-accent-red"
                              )}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-clinical-100 capitalize">
                                {log.action}
                              </span>
                              <span
                                className={cn(
                                  "px-2 py-0.5 text-xs font-medium rounded-full",
                                  getResourceTypeColor(log.resourceType)
                                )}
                              >
                                {log.resourceType}
                              </span>
                              {log.success ? (
                                <CheckCircle2 className="w-4 h-4 text-accent-green" />
                              ) : (
                                <XCircle className="w-4 h-4 text-accent-red" />
                              )}
                            </div>
                            <p className="text-sm text-clinical-400 mb-2">
                              Resource ID: {log.resourceId}
                            </p>
                            {log.details && Object.keys(log.details).length > 0 && (
                              <div className="mt-2 p-2 bg-arc-bg rounded border border-arc-border">
                                <p className="text-xs text-clinical-500 mb-1 font-medium">
                                  Details:
                                </p>
                                <pre className="text-xs text-clinical-300 font-mono overflow-x-auto">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-clinical-500">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(log.timestamp)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-accent-green" />
                <span className="text-sm text-clinical-400">Successful</span>
              </div>
              <p className="text-2xl font-semibold text-clinical-50">
                {activityLogs.filter((l) => l.success).length}
              </p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-accent-red" />
                <span className="text-sm text-clinical-400">Errors</span>
              </div>
              <p className="text-2xl font-semibold text-clinical-50">
                {activityLogs.filter((l) => !l.success).length}
              </p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-accent-cyan" />
                <span className="text-sm text-clinical-400">Total</span>
              </div>
              <p className="text-2xl font-semibold text-clinical-50">
                {activityLogs.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
