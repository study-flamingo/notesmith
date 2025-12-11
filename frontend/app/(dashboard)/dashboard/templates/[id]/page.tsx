"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Download,
  Copy,
  Loader2,
  AlertCircle,
  LayoutTemplate,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { templatesApi, Template } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { exportTemplate, downloadFile } from "@/lib/template-utils";
import { TemplatePreview } from "@/components/templates/template-preview";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TemplateViewPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchTemplate();
  }, [id]);

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

  async function handleDuplicate() {
    if (!template) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const newTemplate = await templatesApi.create(session.access_token, {
        name: `${template.name} (Copy)`,
        description: template.description,
        template_type: template.template_type,
        content: template.content,
        variables: template.variables,
      });

      router.push(`/dashboard/templates/${newTemplate.id}/edit`);
    } catch (err) {
      console.error("Failed to duplicate template:", err);
    }
  }

  function handleExport() {
    if (!template) return;

    const json = exportTemplate(template);
    const filename = `${template.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    downloadFile(json, filename, "application/json");
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      soap: "bg-blue-100 text-blue-700",
      dap: "bg-purple-100 text-purple-700",
      narrative: "bg-green-100 text-green-700",
      custom: "bg-orange-100 text-orange-700",
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-dental-500 animate-spin" />
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-clinical-600 font-medium">{error || "Template not found"}</p>
        <Link href="/dashboard/templates" className="mt-4 btn btn-secondary">
          Back to Templates
        </Link>
      </div>
    );
  }

  const isSystem = !template.practice_id;

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
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold text-clinical-900">
                {template.name}
              </h1>
              {template.is_default && (
                <span className="px-2 py-0.5 text-xs font-medium bg-dental-100 text-dental-700 rounded-full">
                  Default
                </span>
              )}
              <span
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-full uppercase",
                  getTypeColor(template.template_type)
                )}
              >
                {template.template_type}
              </span>
            </div>
            <p className="text-clinical-500">
              {template.description || "No description"}
            </p>
            <p className="text-xs text-clinical-400 mt-1">
              Version {template.version} {isSystem && "• System Template"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="btn btn-secondary"
            title="Export as JSON"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          <button
            onClick={handleDuplicate}
            className="btn btn-secondary"
            title="Create a copy"
          >
            <Copy className="w-4 h-4 mr-2" />
            Duplicate
          </button>
          <Link
            href={`/dashboard/templates/${template.id}/edit`}
            className="btn btn-primary"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Link>
        </div>
      </div>

      {/* Template Content */}
      <div className="card">
        <div className="border-b border-clinical-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-clinical-500" />
            <h2 className="font-medium text-clinical-900">Template Content</h2>
          </div>
        </div>
        <div className="p-6">
          <TemplatePreview content={template.content} />
        </div>
      </div>

      {/* Variables Info */}
      {template.variables && template.variables.length > 0 && (
        <div className="card">
          <div className="border-b border-clinical-200 px-6 py-4">
            <h2 className="font-medium text-clinical-900">Template Variables</h2>
          </div>
          <div className="p-6">
            <div className="grid gap-3">
              {template.variables.map((variable, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-3 bg-clinical-50 rounded-lg"
                >
                  <div>
                    <code className="text-sm font-mono text-dental-600">
                      {variable.name}
                    </code>
                    <p className="text-sm text-clinical-500 mt-1">
                      {variable.description}
                    </p>
                  </div>
                  {variable.required && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                      Required
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



