"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, Plus, Search, Filter, MoreVertical } from "lucide-react";
import { cn, formatDate, getStatusColor } from "@/lib/utils";

// Mock data - would come from API
const mockAppointments = [
  {
    id: "1",
    patient_ref: "PT-1001",
    appointment_date: new Date().toISOString(),
    status: "completed",
    notes: "Regular checkup",
  },
  {
    id: "2",
    patient_ref: "PT-1002",
    appointment_date: new Date(Date.now() + 86400000).toISOString(),
    status: "scheduled",
    notes: "Follow-up appointment",
  },
  {
    id: "3",
    patient_ref: "PT-1003",
    appointment_date: new Date(Date.now() - 86400000).toISOString(),
    status: "completed",
    notes: "Root canal procedure",
  },
];

export default function AppointmentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredAppointments = mockAppointments.filter((apt) => {
    const matchesSearch = apt.patient_ref
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || apt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-clinical-900">
            Appointments
          </h1>
          <p className="text-clinical-500 mt-1">
            Manage your dental appointments and recordings
          </p>
        </div>
        <Link href="/dashboard/appointments/new" className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          New Appointment
        </Link>
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
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button className="btn btn-secondary">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Appointments list */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-clinical-50 border-b border-clinical-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-clinical-600">
                Patient
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium text-clinical-600">
                Date & Time
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium text-clinical-600">
                Status
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium text-clinical-600">
                Notes
              </th>
              <th className="text-right px-6 py-4 text-sm font-medium text-clinical-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-clinical-100">
            {filteredAppointments.map((appointment) => (
              <tr key={appointment.id} className="hover:bg-clinical-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-dental-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-dental-600" />
                    </div>
                    <div>
                      <p className="font-medium text-clinical-900">
                        {appointment.patient_ref}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-clinical-600">
                  {formatDate(appointment.appointment_date)}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      "px-2.5 py-1 text-xs font-medium rounded-full capitalize",
                      getStatusColor(appointment.status)
                    )}
                  >
                    {appointment.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-clinical-600 max-w-xs truncate">
                  {appointment.notes || "-"}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/dashboard/appointments/${appointment.id}`}
                      className="btn btn-ghost text-sm"
                    >
                      View
                    </Link>
                    <button className="p-2 text-clinical-400 hover:text-clinical-600">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAppointments.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-clinical-300 mx-auto mb-4" />
            <p className="text-clinical-600 font-medium">No appointments found</p>
            <p className="text-clinical-400 text-sm mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

