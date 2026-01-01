import "@testing-library/jest-dom/vitest";

// Mock window.URL for template-utils tests
if (typeof window !== "undefined") {
    window.URL.createObjectURL = vi.fn(() => "mock-blob-url");
    window.URL.revokeObjectURL = vi.fn();
}

