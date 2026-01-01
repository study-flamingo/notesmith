"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  CheckCircle,
  MoreVertical,
} from "lucide-react";
import { cn, formatDate, getStatusColor } from "@/lib/utils";

const mockNotes = [
  {
    id: "1",
    patient_ref: "PT-1001",
    template_name: "SOAP Note",
    status: "finalized",
    created_at: new Date().toISOString(),
    reviewed_at: new Date().toISOString(),
  },
  {
    id: "2",
    patient_ref: "PT-1002",
    template_name: "DAP Note",
    status: "generated",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    reviewed_at: null,
  },
  {
    id: "3",
    patient_ref: "PT-1003",
    template_name: "SOAP Note",
    status: "reviewed",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    reviewed_at: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: "4",
    patient_ref: "PT-1004",
    template_name: "Narrative Note",
    status: "draft",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    reviewed_at: null,
  },
];

export default function NotesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const filteredNotes = mockNotes.filter((note) => {
    const matchesSearch = note.patient_ref
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || note.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-clinical-900">
            Clinical Notes
          </h1>
          <p className="text-clinical-500 mt-1">
            View and manage generated clinical notes
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-clinical-400" />
            <input
              type="search"
              placeholder="Search by patient reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="generated">Generated</option>
              <option value="reviewed">Reviewed</option>
              <option value="finalized">Finalized</option>
              <option value="exported">Exported</option>
            </select>
            <button className="btn btn-secondary">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Notes list */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-clinical-50 border-b border-clinical-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-clinical-600">
                Patient
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium text-clinical-600">
                Template
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium text-clinical-600">
                Status
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium text-clinical-600">
                Created
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium text-clinical-600">
                Reviewed
              </th>
              <th className="text-right px-6 py-4 text-sm font-medium text-clinical-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-clinical-100">
            {filteredNotes.map((note) => (
              <tr key={note.id} className="hover:bg-clinical-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="font-medium text-clinical-900">
                      {note.patient_ref}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-clinical-600">
                  {note.template_name}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      "px-2.5 py-1 text-xs font-medium rounded-full capitalize",
                      getStatusColor(note.status)
                    )}
                  >
                    {note.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-clinical-600">
                  {formatDate(note.created_at)}
                </td>
                <td className="px-6 py-4 text-sm text-clinical-600">
                  {note.reviewed_at ? formatDate(note.reviewed_at) : "-"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/dashboard/notes/${note.id}`}
                      className="p-2 text-clinical-400 hover:text-clinical-600 rounded-lg hover:bg-clinical-100"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/dashboard/notes/${note.id}/edit`}
                      className="p-2 text-clinical-400 hover:text-clinical-600 rounded-lg hover:bg-clinical-100"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    {note.status === "reviewed" && (
                      <button
                        className="p-2 text-clinical-400 hover:text-green-600 rounded-lg hover:bg-green-50"
                        title="Finalize"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActiveDropdown(
                            activeDropdown === note.id ? null : note.id
                          )
                        }
                        className="p-2 text-clinical-400 hover:text-clinical-600 rounded-lg hover:bg-clinical-100"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {activeDropdown === note.id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-clinical-200 py-1 z-10">
                          <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-clinical-600 hover:bg-clinical-50">
                            <Download className="w-4 h-4" />
                            Export as PDF
                          </button>
                          <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-clinical-600 hover:bg-clinical-50">
                            <Download className="w-4 h-4" />
                            Export as DOCX
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredNotes.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-clinical-300 mx-auto mb-4" />
            <p className="text-clinical-600 font-medium">No notes found</p>
            <p className="text-clinical-400 text-sm mt-1">
              Generate notes from your recorded appointments
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

