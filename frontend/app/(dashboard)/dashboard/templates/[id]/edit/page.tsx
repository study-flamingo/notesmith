"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  Download,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { templatesApi, Template, TemplateCreate } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import {
  exportTemplate,
  downloadFile,
  parseTemplateImport,
} from "@/lib/template-utils";
import { TemplateEditor } from "@/components/templates/template-editor";

interface PageProps {
  params: Promise<{ id: string }>;
}

const TEMPLATE_TYPES = [
  { value: "soap", label: "SOAP Note" },
  { value: "dap", label: "DAP Note" },
  { value: "narrative", label: "Narrative" },
  { value: "custom", label: "Custom" },
];

export default function TemplateEditPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [templateType, setTemplateType] = useState("custom");
  const [content, setContent] = useState("");

  const supabase = createClient();

  useEffect(() => {
    fetchTemplate();
  }, [id]);

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

  async function fetchTemplate() {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.push("/login");
        return;
      }

      const data = await templatesApi.get(session.access_token, id);
      setTemplate(data);
      setName(data.name);
      setDescription(data.description || "");
      setTemplateType(data.template_type);
      setContent(data.content);
    } catch (err) {
      console.error("Failed to fetch template:", err);
      const message = err instanceof Error ? err.message : "Failed to load template";
      
      if (message.toLowerCase().includes("token") || message.toLowerCase().includes("unauthorized")) {
        await supabase.auth.signOut();
        router.push("/login");
        return;
      }
      
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError("Please sign in to save changes");
        return;
      }

      await templatesApi.update(session.access_token, id, {
        name,
        description: description || undefined,
        content,
      });

      setHasChanges(false);
      router.push(`/dashboard/templates/${id}`);
    } catch (err) {
      console.error("Failed to save template:", err);
      setError(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setSaving(false);
    }
  }

  function handleExport() {
    if (!template) return;

    const exportData = {
      ...template,
      name,
      description,
      template_type: templateType,
      content,
    };

    const json = exportTemplate(exportData);
    const filename = `${name.toLowerCase().replace(/\s+/g, "-")}.json`;
    downloadFile(json, filename, "application/json");
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

        // Only import the content, keep existing metadata
        if (confirm("Import template content? This will replace the current content.")) {
          setContent(imported.content);
          setHasChanges(true);
        }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-dental-500 animate-spin" />
      </div>
    );
  }

  if (error && !template) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-clinical-600 font-medium">{error}</p>
        <Link href="/dashboard/templates" className="mt-4 btn btn-secondary">
          Back to Templates
        </Link>
      </div>
    );
  }

  const isSystem = template && !template.practice_id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link
            href={`/dashboard/templates/${id}`}
            className="mt-1 p-2 text-clinical-400 hover:text-clinical-600 rounded-lg hover:bg-clinical-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-clinical-900">
              Edit Template
            </h1>
            <p className="text-clinical-500 mt-1">
              {isSystem ? "Editing system template (changes will create a new version)" : "Make changes to your template"}
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
            onClick={handleExport}
            className="btn btn-secondary"
            title="Export as JSON"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="btn btn-primary"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
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

      {/* Unsaved changes banner */}
      {hasChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
          <p className="text-amber-700">You have unsaved changes</p>
          <button onClick={handleSave} disabled={saving} className="btn btn-sm btn-primary">
            Save Now
          </button>
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
              placeholder="Template name"
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
              disabled={isSystem}
            >
              {TEMPLATE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-clinical-700 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => updateField(setDescription)(e.target.value)}
              className="input min-h-[80px]"
              placeholder="Brief description of this template"
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
          />
        </div>
      </div>

      {/* Version info */}
      {template && (
        <div className="text-sm text-clinical-500 text-center">
          Version {template.version} • Last updated {new Date(template.created_at).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}



