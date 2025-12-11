"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutTemplate,
  Plus,
  Search,
  Edit,
  Copy,
  Trash2,
  MoreVertical,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { templatesApi, Template } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError("Please sign in to view templates");
        return;
      }

      const data = await templatesApi.list(session.access_token);
      setTemplates(data);
    } catch (err) {
      console.error("Failed to fetch templates:", err);
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }

  async function handleDuplicate(template: Template) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      await templatesApi.create(session.access_token, {
        name: `${template.name} (Copy)`,
        description: template.description,
        template_type: template.template_type,
        content: template.content,
        variables: template.variables,
      });

      fetchTemplates();
      setActiveDropdown(null);
    } catch (err) {
      console.error("Failed to duplicate template:", err);
    }
  }

  async function handleDelete(templateId: string) {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      setDeletingId(templateId);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      await templatesApi.delete(session.access_token, templateId);
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      setActiveDropdown(null);
    } catch (err) {
      console.error("Failed to delete template:", err);
    } finally {
      setDeletingId(null);
    }
  }

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      soap: "bg-blue-100 text-blue-700",
      dap: "bg-purple-100 text-purple-700",
      narrative: "bg-green-100 text-green-700",
      custom: "bg-orange-100 text-orange-700",
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside() {
      setActiveDropdown(null);
    }
    if (activeDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [activeDropdown]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-dental-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-clinical-600 font-medium">{error}</p>
        <button
          onClick={fetchTemplates}
          className="mt-4 btn btn-secondary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-clinical-900">Templates</h1>
          <p className="text-clinical-500 mt-1">
            Manage clinical note templates for your practice
          </p>
        </div>
        <Link href="/dashboard/templates/new" className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Link>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-clinical-400" />
          <input
            type="search"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Templates grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const isSystem = !template.practice_id;
          
          return (
            <div
              key={template.id}
              className="card p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-clinical-100 rounded-lg flex items-center justify-center">
                  <LayoutTemplate className="w-6 h-6 text-clinical-600" />
                </div>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdown(
                        activeDropdown === template.id ? null : template.id
                      );
                    }}
                    className="p-2 text-clinical-400 hover:text-clinical-600 rounded-lg hover:bg-clinical-100"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {activeDropdown === template.id && (
                    <div
                      className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-clinical-200 py-1 z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        href={`/dashboard/templates/${template.id}/edit`}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-clinical-600 hover:bg-clinical-50"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDuplicate(template)}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-clinical-600 hover:bg-clinical-50"
                      >
                        <Copy className="w-4 h-4" />
                        Duplicate
                      </button>
                      {!isSystem && (
                        <button
                          onClick={() => handleDelete(template.id)}
                          disabled={deletingId === template.id}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingId === template.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-clinical-900">{template.name}</h3>
                {template.is_default && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-dental-100 text-dental-700 rounded-full">
                    Default
                  </span>
                )}
              </div>

              <p className="text-sm text-clinical-500 mb-4 line-clamp-2">
                {template.description || "No description"}
              </p>

              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded-full uppercase",
                    getTypeColor(template.template_type)
                  )}
                >
                  {template.template_type}
                </span>
                <span className="text-xs text-clinical-400">
                  v{template.version}
                  {isSystem && " • System"}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-clinical-100 flex gap-2">
                <Link
                  href={`/dashboard/templates/${template.id}`}
                  className="btn btn-secondary flex-1 text-sm"
                >
                  View
                </Link>
                <Link
                  href={`/dashboard/templates/${template.id}/edit`}
                  className="btn btn-primary flex-1 text-sm"
                >
                  Edit
                </Link>
              </div>
            </div>
          );
        })}

        {/* New template card */}
        <Link
          href="/dashboard/templates/new"
          className="card p-6 border-2 border-dashed border-clinical-300 hover:border-dental-400 hover:bg-clinical-50 transition-colors flex flex-col items-center justify-center text-center min-h-[280px]"
        >
          <div className="w-12 h-12 bg-clinical-100 rounded-lg flex items-center justify-center mb-4">
            <Plus className="w-6 h-6 text-clinical-400" />
          </div>
          <h3 className="font-semibold text-clinical-900 mb-2">
            Create New Template
          </h3>
          <p className="text-sm text-clinical-500">
            Build a custom template for your practice
          </p>
        </Link>
      </div>

      {filteredTemplates.length === 0 && !loading && (
        <div className="card p-12 text-center">
          <LayoutTemplate className="w-12 h-12 text-clinical-300 mx-auto mb-4" />
          <p className="text-clinical-600 font-medium">No templates found</p>
          <p className="text-clinical-400 text-sm mt-1">
            {searchQuery ? "Try adjusting your search" : "Create your first template to get started"}
          </p>
        </div>
      )}
    </div>
  );
}
