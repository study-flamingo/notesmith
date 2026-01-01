import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    pending: "bg-gray-100 text-gray-800",
    processing: "bg-yellow-100 text-yellow-800",
    failed: "bg-red-100 text-red-800",
    draft: "bg-gray-100 text-gray-800",
    generated: "bg-blue-100 text-blue-800",
    reviewed: "bg-purple-100 text-purple-800",
    finalized: "bg-green-100 text-green-800",
    exported: "bg-teal-100 text-teal-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

