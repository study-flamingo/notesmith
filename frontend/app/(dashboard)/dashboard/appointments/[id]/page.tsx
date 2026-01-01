"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Calendar, FileAudio, Bot, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { appointmentsApi, recordingsApi, templatesApi, type Appointment, type Recording, type Template } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import Link from "next/link";

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id as string;
  const supabase = createClient();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [appointmentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.push("/login");
        return;
      }

      // Fetch appointment details
      const appointmentData = await appointmentsApi.get(session.access_token, appointmentId);
      setAppointment(appointmentData);
      setSelectedTemplateIds(appointmentData.template_ids || []);

      // Fetch recordings for this appointment
      const recordingsData = await recordingsApi.listForAppointment(session.access_token, appointmentId);
      setRecordings(recordingsData);

      // Fetch available templates
      const templatesData = await templatesApi.list(session.access_token);
      setTemplates(templatesData);
    } catch (err) {
      console.error("Failed to fetch appointment data:", err);
      setError(err instanceof Error ? err.message : "Failed to load appointment");
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateToggle = async (templateId: string) => {
    const newTemplateIds = selectedTemplateIds.includes(templateId)
      ? selectedTemplateIds.filter((id) => id !== templateId)
      : [...selectedTemplateIds, templateId];

    setSelectedTemplateIds(newTemplateIds);

    // Update appointment with new template selection
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      await appointmentsApi.update(session.access_token, appointmentId, {
        template_ids: newTemplateIds,
      });
    } catch (err) {
      console.error("Failed to update templates:", err);
    }
  };

  const handleProcessWithAI = async () => {
    setError(null);
    setSuccess(null);

    // Validation
    if (recordings.length === 0) {
      setError("This appointment must have at least one recording before processing.");
      return;
    }

    if (selectedTemplateIds.length === 0) {
      setError("Please select at least one template before processing.");
      return;
    }

    try {
      setProcessing(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.push("/login");
        return;
      }

      const result = await appointmentsApi.process(session.access_token, appointmentId);

      setSuccess(`Processing started! Task ID: ${result.task_id}. The appointment will be transcribed and clinical notes will be generated.`);

      // Refresh appointment to show updated status
      await fetchData();
    } catch (err) {
      console.error("Failed to process appointment:", err);
      setError(err instanceof Error ? err.message : "Failed to start processing");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-dental-500" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="space-y-6">
        <div className="card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-clinical-400 mx-auto mb-4" />
          <p className="text-clinical-50 font-medium">Appointment not found</p>
          <Link href="/dashboard/appointments" className="btn btn-secondary mt-4">
            Back to Appointments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/appointments" className="btn btn-ghost">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-clinical-50">
              Appointment Details
            </h1>
            <p className="text-clinical-400 mt-1">
              Patient: {appointment.patient_ref}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-full capitalize",
            appointment.status === "completed" && "bg-green-500/10 text-green-500",
            appointment.status === "in_progress" && "bg-yellow-500/10 text-yellow-500",
            appointment.status === "scheduled" && "bg-blue-500/10 text-blue-500",
            appointment.status === "cancelled" && "bg-red-500/10 text-red-500"
          )}
        >
          {appointment.status.replace("_", " ")}
        </span>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="card bg-red-500/10 border-red-500/20 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-500 font-medium">Error</p>
              <p className="text-red-400 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="card bg-green-500/10 border-green-500/20 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-500 font-medium">Success</p>
              <p className="text-green-400 text-sm mt-1">{success}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Appointment Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appointment Information */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-clinical-50 mb-4">
              Appointment Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-clinical-400 text-sm">Patient Reference</p>
                <p className="text-clinical-50 font-medium">{appointment.patient_ref}</p>
              </div>
              <div>
                <p className="text-clinical-400 text-sm">Appointment Date</p>
                <p className="text-clinical-50 font-medium">{formatDate(appointment.appointment_date)}</p>
              </div>
              {appointment.notes && (
                <div>
                  <p className="text-clinical-400 text-sm">Notes</p>
                  <p className="text-clinical-50">{appointment.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Recordings */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-clinical-50">
                Recordings ({recordings.length})
              </h2>
            </div>

            {recordings.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-clinical-700 rounded-lg">
                <FileAudio className="w-10 h-10 text-clinical-400 mx-auto mb-3" />
                <p className="text-clinical-400 text-sm">No recordings uploaded yet</p>
                <p className="text-clinical-500 text-xs mt-1">
                  Upload at least one recording to process this appointment
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recordings.map((recording) => (
                  <div
                    key={recording.id}
                    className="flex items-center gap-3 p-3 bg-clinical-800 rounded-lg"
                  >
                    <FileAudio className="w-5 h-5 text-dental-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-clinical-50 text-sm font-medium truncate">
                        {recording.filename}
                      </p>
                      <p className="text-clinical-400 text-xs">
                        {(recording.file_size / 1024 / 1024).toFixed(2)} MB
                        {recording.duration_seconds && ` • ${Math.floor(recording.duration_seconds / 60)}:${(recording.duration_seconds % 60).toString().padStart(2, '0')}`}
                      </p>
                    </div>
                    <span className={cn(
                      "px-2 py-1 text-xs rounded-full",
                      recording.status === "uploaded" && "bg-blue-500/10 text-blue-500",
                      recording.status === "processing" && "bg-yellow-500/10 text-yellow-500",
                      recording.status === "completed" && "bg-green-500/10 text-green-500"
                    )}>
                      {recording.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Templates & Actions */}
        <div className="space-y-6">
          {/* Template Selection */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-clinical-50 mb-4">
              Templates ({selectedTemplateIds.length} selected)
            </h2>

            {templates.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-clinical-700 rounded-lg">
                <p className="text-clinical-400 text-sm">No templates available</p>
                <Link href="/dashboard/templates/new" className="btn btn-secondary btn-sm mt-3">
                  Create Template
                </Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {templates.map((template) => (
                  <label
                    key={template.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                      selectedTemplateIds.includes(template.id)
                        ? "bg-dental-500/10 border-2 border-dental-500"
                        : "bg-clinical-800 border-2 border-transparent hover:border-clinical-600"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTemplateIds.includes(template.id)}
                      onChange={() => handleTemplateToggle(template.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-clinical-50 text-sm font-medium">
                        {template.name}
                      </p>
                      {template.description && (
                        <p className="text-clinical-400 text-xs mt-1 line-clamp-2">
                          {template.description}
                        </p>
                      )}
                      <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded bg-clinical-700 text-clinical-300 uppercase">
                        {template.template_type}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Process with AI Button */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-clinical-50 mb-4">
              AI Processing
            </h2>
            <p className="text-clinical-400 text-sm mb-4">
              Process this appointment with AI to transcribe recordings and generate clinical notes.
            </p>

            <button
              onClick={handleProcessWithAI}
              disabled={processing || appointment.status === "in_progress"}
              className={cn(
                "btn btn-primary w-full",
                processing && "opacity-50 cursor-not-allowed"
              )}
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : appointment.status === "in_progress" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  In Progress
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4 mr-2" />
                  Process with AI
                </>
              )}
            </button>

            <div className="mt-4 p-3 bg-clinical-800 rounded-lg">
              <p className="text-clinical-400 text-xs font-medium mb-2">Requirements:</p>
              <ul className="space-y-1 text-clinical-500 text-xs">
                <li className="flex items-center gap-2">
                  {recordings.length > 0 ? (
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-red-500" />
                  )}
                  At least 1 recording
                </li>
                <li className="flex items-center gap-2">
                  {selectedTemplateIds.length > 0 ? (
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-red-500" />
                  )}
                  At least 1 template selected
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
