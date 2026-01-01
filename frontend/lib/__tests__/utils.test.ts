import { describe, it, expect } from "vitest";
import { cn, formatDate, formatDuration, formatFileSize, getStatusColor } from "../utils";

describe("cn (className merge)", () => {
    it("merges class names correctly", () => {
        expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("handles conditional classes", () => {
        expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
        expect(cn("foo", true && "bar", "baz")).toBe("foo bar baz");
    });

    it("handles tailwind conflicts correctly", () => {
        // tailwind-merge should resolve conflicting utilities
        expect(cn("p-4", "p-2")).toBe("p-2");
        expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });

    it("handles undefined and null values", () => {
        expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
    });

    it("handles arrays of classes", () => {
        expect(cn(["foo", "bar"], "baz")).toBe("foo bar baz");
    });
});

describe("formatDate", () => {
    it("formats date strings correctly", () => {
        const result = formatDate("2024-12-10T10:30:00Z");
        // The output depends on locale, but should contain date components
        expect(result).toBeTruthy();
        expect(result.length).toBeGreaterThan(0);
    });

    it("formats Date objects correctly", () => {
        const date = new Date("2024-06-15T14:00:00Z");
        const result = formatDate(date);
        expect(result).toBeTruthy();
    });

    it("includes time component", () => {
        const result = formatDate("2024-12-10T10:30:00Z");
        // Should include some time indicator (AM/PM or 24hr format)
        expect(result).toMatch(/\d{1,2}:\d{2}/);
    });
});

describe("formatDuration", () => {
    it("formats seconds less than a minute", () => {
        expect(formatDuration(45)).toBe("0:45");
    });

    it("formats exact minutes", () => {
        expect(formatDuration(60)).toBe("1:00");
        expect(formatDuration(120)).toBe("2:00");
    });

    it("formats minutes with seconds", () => {
        expect(formatDuration(90)).toBe("1:30");
        expect(formatDuration(185)).toBe("3:05");
    });

    it("pads seconds with leading zero", () => {
        expect(formatDuration(61)).toBe("1:01");
        expect(formatDuration(69)).toBe("1:09");
    });

    it("handles zero", () => {
        expect(formatDuration(0)).toBe("0:00");
    });

    it("handles large durations", () => {
        expect(formatDuration(3600)).toBe("60:00"); // 1 hour
        expect(formatDuration(3661)).toBe("61:01"); // 1 hour, 1 min, 1 sec
    });
});

describe("formatFileSize", () => {
    it("formats bytes", () => {
        expect(formatFileSize(100)).toBe("100 B");
        expect(formatFileSize(512)).toBe("512 B");
        expect(formatFileSize(1023)).toBe("1023 B");
    });

    it("formats kilobytes", () => {
        expect(formatFileSize(1024)).toBe("1.0 KB");
        expect(formatFileSize(1536)).toBe("1.5 KB");
        expect(formatFileSize(10240)).toBe("10.0 KB");
    });

    it("formats megabytes", () => {
        expect(formatFileSize(1048576)).toBe("1.0 MB");
        expect(formatFileSize(1572864)).toBe("1.5 MB");
        expect(formatFileSize(10485760)).toBe("10.0 MB");
    });

    it("handles zero", () => {
        expect(formatFileSize(0)).toBe("0 B");
    });

    it("handles edge cases at boundaries", () => {
        // Just under 1 KB
        expect(formatFileSize(1023)).toBe("1023 B");
        // Just at 1 KB
        expect(formatFileSize(1024)).toBe("1.0 KB");
        // Just under 1 MB
        expect(formatFileSize(1048575)).toBe("1024.0 KB");
        // Just at 1 MB
        expect(formatFileSize(1048576)).toBe("1.0 MB");
    });
});

describe("getStatusColor", () => {
    it("returns correct color for scheduled status", () => {
        expect(getStatusColor("scheduled")).toBe("bg-blue-100 text-blue-800");
    });

    it("returns correct color for in_progress status", () => {
        expect(getStatusColor("in_progress")).toBe("bg-yellow-100 text-yellow-800");
    });

    it("returns correct color for completed status", () => {
        expect(getStatusColor("completed")).toBe("bg-green-100 text-green-800");
    });

    it("returns correct color for cancelled status", () => {
        expect(getStatusColor("cancelled")).toBe("bg-red-100 text-red-800");
    });

    it("returns correct color for pending status", () => {
        expect(getStatusColor("pending")).toBe("bg-gray-100 text-gray-800");
    });

    it("returns correct color for processing status", () => {
        expect(getStatusColor("processing")).toBe("bg-yellow-100 text-yellow-800");
    });

    it("returns correct color for failed status", () => {
        expect(getStatusColor("failed")).toBe("bg-red-100 text-red-800");
    });

    it("returns correct color for draft status", () => {
        expect(getStatusColor("draft")).toBe("bg-gray-100 text-gray-800");
    });

    it("returns correct color for generated status", () => {
        expect(getStatusColor("generated")).toBe("bg-blue-100 text-blue-800");
    });

    it("returns correct color for reviewed status", () => {
        expect(getStatusColor("reviewed")).toBe("bg-purple-100 text-purple-800");
    });

    it("returns correct color for finalized status", () => {
        expect(getStatusColor("finalized")).toBe("bg-green-100 text-green-800");
    });

    it("returns correct color for exported status", () => {
        expect(getStatusColor("exported")).toBe("bg-teal-100 text-teal-800");
    });

    it("returns default color for unknown status", () => {
        expect(getStatusColor("unknown")).toBe("bg-gray-100 text-gray-800");
        expect(getStatusColor("")).toBe("bg-gray-100 text-gray-800");
    });
});

