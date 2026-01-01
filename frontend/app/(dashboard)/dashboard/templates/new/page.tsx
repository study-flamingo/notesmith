"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  Upload,
} from "lucide-react";
import { templatesApi, TemplateCreate } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { parseTemplateImport } from "@/lib/template-utils";
import { TemplateEditor } from "@/components/templates/template-editor";

const TEMPLATE_TYPES = [
  { value: "soap", label: "SOAP Note" },
  { value: "dap", label: "DAP Note" },
  { value: "narrative", label: "Narrative" },
  { value: "custom", label: "Custom" },
];

const STARTER_TEMPLATES: Record<string, string> = {
  soap: `DENTAL CLINICAL NOTE - SOAP FORMAT

Date: {{ date }}
Provider: {{ provider }}

SUBJECTIVE:
Chief Complaint: <Chief Complaint>

History of Present Illness:
<Health History Updates>

OBJECTIVE:
Clinical Examination:
<Clinical Findings>

ASSESSMENT:
<Assessment>

PLAN:
Procedures Performed:
<Procedures Performed>

Recommendations:
<Recommendations>

Follow-up: <Follow-up Instructions>

_____________________________
Provider Signature`,

  dap: `DENTAL CLINICAL NOTE - DAP FORMAT

Date: {{ date }}
Provider: {{ provider }}

DATA:
<Chief Complaint>

Clinical Findings:
<Clinical Findings>

ASSESSMENT:
<Assessment>

PLAN:
<Procedures Performed>

Recommendations:
<Recommendations>

_____________________________
Provider Signature`,

  narrative: `DENTAL CLINICAL NOTE

Date: {{ date }}
Provider: {{ provider }}
Patient Reference: {{ patient_ref }}

<Summary>

Chief Complaint:
<Chief Complaint>

Clinical Findings:
<Clinical Findings>

Treatment Provided:
<Procedures Performed>

Recommendations and Follow-up:
<Recommendations>

_____________________________
Provider Signature`,

  custom: `CLINICAL NOTE

Date: {{ date }}
Provider: {{ provider }}

<Chief Complaint>

<Clinical Findings>

<Procedures Performed>

<Recommendations>
`,
};

export default function NewTemplatePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [templateType, setTemplateType] = useState("custom");
  const [content, setContent] = useState(STARTER_TEMPLATES.custom);

  const supabase = createClient();

  // Update starter content when type changes (only if content matches a starter)
  useEffect(() => {
    const currentIsStarter = Object.values(STARTER_TEMPLATES).includes(content);
    if (currentIsStarter || !content.trim()) {
      setContent(STARTER_TEMPLATES[templateType] || STARTER_TEMPLATES.custom);
    }
  }, [templateType]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  async function handleSave() {
    if (!name.trim()) {
      setError("Template name is required");
      return;
    }

    if (!content.trim()) {
      setError("Template content is required");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.push("/login");
        return;
      }

      // Get user's practice_id from their profile
      const { data: userData } = await supabase
        .from("users")
        .select("practice_id")
        .eq("id", session.user.id)
        .single();

      const newTemplate: TemplateCreate = {
        name: name.trim(),
        description: description.trim() || undefined,
        template_type: templateType,
        content,
        practice_id: userData?.practice_id || undefined,
      };

      const created = await templatesApi.create(session.access_token, newTemplate);

      setHasChanges(false);
      router.push(`/dashboard/templates/${created.id}`);
    } catch (err) {
      console.error("Failed to create template:", err);
      const message = err instanceof Error ? err.message : "Failed to create template";
      
      if (message.toLowerCase().includes("token") || message.toLowerCase().includes("unauthorized")) {
        await supabase.auth.signOut();
        router.push("/login");
        return;
      }
      
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const imported = parseTemplateImport(text);

        if (!imported) {
          setError("Invalid template file format");
          return;
        }

        // Import all fields
        setName(imported.name + " (Imported)");
        setDescription(imported.description || "");
        setTemplateType(imported.template_type as string);
        setContent(imported.content);
        setHasChanges(true);
      } catch (err) {
        console.error("Failed to import template:", err);
        setError("Failed to read template file");
      }
    };
    input.click();
  }

  function updateField<T>(setter: (val: T) => void) {
    return (val: T) => {
      setter(val);
      setHasChanges(true);
    };
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/dashboard/templates"
            className="mt-1 p-2 text-clinical-400 hover:text-clinical-600 rounded-lg hover:bg-clinical-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-clinical-900">
              Create New Template
            </h1>
            <p className="text-clinical-500 mt-1">
              Build a custom clinical note template for your practice
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleImport}
            className="btn btn-secondary"
            title="Import from JSON"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Create Template
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Template metadata form */}
      <div className="card">
        <div className="border-b border-clinical-200 px-6 py-4">
          <h2 className="font-medium text-clinical-900">Template Details</h2>
        </div>
        <div className="p-6 grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-clinical-700 mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => updateField(setName)(e.target.value)}
              className="input"
              placeholder="e.g., Routine Checkup Template"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-clinical-700 mb-1.5">
              Type
            </label>
            <select
              value={templateType}
              onChange={(e) => updateField(setTemplateType)(e.target.value)}
              className="input"
            >
              {TEMPLATE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-clinical-500 mt-1">
              Choose a format that best fits your documentation needs
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-clinical-700 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => updateField(setDescription)(e.target.value)}
              className="input min-h-[80px]"
              placeholder="Brief description of when to use this template"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Template content editor */}
      <div className="card">
        <div className="border-b border-clinical-200 px-6 py-4">
          <h2 className="font-medium text-clinical-900">Template Content</h2>
        </div>
        <div className="p-6">
          <TemplateEditor
            value={content}
            onChange={updateField(setContent)}
            showPreview={true}
            placeholder="Enter your template content here. Use <Tag Name> for placeholders or {{ variable }} for Jinja2 syntax."
          />
        </div>
      </div>

      {/* Help section */}
      <div className="card bg-dental-50 border-dental-200">
        <div className="p-6">
          <h3 className="font-medium text-dental-800 mb-3">Template Syntax Help</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-dental-700 mb-2">Tag Placeholders</h4>
              <p className="text-dental-600 mb-2">
                Use angle brackets for simple placeholders that the AI will fill:
              </p>
              <code className="block bg-white rounded px-3 py-2 text-blue-700">
                &lt;Chief Complaint&gt;
              </code>
            </div>
            <div>
              <h4 className="font-medium text-dental-700 mb-2">Jinja2 Variables</h4>
              <p className="text-dental-600 mb-2">
                Use double braces for structured data with optional formatting:
              </p>
              <code className="block bg-white rounded px-3 py-2 text-purple-700">
                {"{{ findings | bullet_list }}"}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



