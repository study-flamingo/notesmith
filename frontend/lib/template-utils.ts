/**
 * Template utilities for syntax highlighting and import/export
 */

import { Template, TemplateVariable } from "./api";

// Regex patterns for template syntax
export const TAG_PATTERN = /<([A-Za-z][A-Za-z0-9 ]*)>/g;
export const JINJA_VAR_PATTERN = /\{\{\s*([^}|]+)(?:\s*\|\s*([^}]+))?\s*\}\}/g;
export const JINJA_BLOCK_PATTERN = /\{%\s*(if|for|endif|endfor|else|elif)\s*[^%]*\s*%\}/g;

export interface HighlightToken {
    type: "tag" | "jinja-var" | "jinja-filter" | "jinja-block" | "text";
    value: string;
    start: number;
    end: number;
}

/**
 * Parse template content and return tokens for syntax highlighting
 */
export function tokenizeTemplate(content: string): HighlightToken[] {
    const tokens: HighlightToken[] = [];
    let lastIndex = 0;

    // Combined pattern for all syntax types
    const combinedPattern = new RegExp(
        `(${TAG_PATTERN.source})|(${JINJA_VAR_PATTERN.source})|(${JINJA_BLOCK_PATTERN.source})`,
        "g"
    );

    let match;
    while ((match = combinedPattern.exec(content)) !== null) {
        // Add text before match
        if (match.index > lastIndex) {
            tokens.push({
                type: "text",
                value: content.slice(lastIndex, match.index),
                start: lastIndex,
                end: match.index,
            });
        }

        const fullMatch = match[0];

        if (fullMatch.startsWith("<") && fullMatch.endsWith(">")) {
            // Tag-based placeholder
            tokens.push({
                type: "tag",
                value: fullMatch,
                start: match.index,
                end: match.index + fullMatch.length,
            });
        } else if (fullMatch.startsWith("{{")) {
            // Jinja2 variable
            tokens.push({
                type: "jinja-var",
                value: fullMatch,
                start: match.index,
                end: match.index + fullMatch.length,
            });
        } else if (fullMatch.startsWith("{%")) {
            // Jinja2 block
            tokens.push({
                type: "jinja-block",
                value: fullMatch,
                start: match.index,
                end: match.index + fullMatch.length,
            });
        }

        lastIndex = match.index + fullMatch.length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
        tokens.push({
            type: "text",
            value: content.slice(lastIndex),
            start: lastIndex,
            end: content.length,
        });
    }

    return tokens;
}

/**
 * Extract all placeholders from template content
 */
export function extractPlaceholders(content: string): string[] {
    const placeholders: Set<string> = new Set();

    // Extract tag-based placeholders
    let match;
    const tagPattern = new RegExp(TAG_PATTERN.source, "g");
    while ((match = tagPattern.exec(content)) !== null) {
        placeholders.add(match[1]);
    }

    // Extract Jinja2 variables
    const jinjaPattern = new RegExp(JINJA_VAR_PATTERN.source, "g");
    while ((match = jinjaPattern.exec(content)) !== null) {
        placeholders.add(match[1].trim());
    }

    return Array.from(placeholders);
}

/**
 * Export template interface for JSON files
 */
export interface TemplateExport {
    name: string;
    description?: string;
    template_type: string;
    content: string;
    variables?: TemplateVariable[];
    version: number;
    exported_at: string;
}

/**
 * Export a template to JSON format
 */
export function exportTemplate(template: Template): string {
    const exportData: TemplateExport = {
        name: template.name,
        description: template.description,
        template_type: template.template_type,
        content: template.content,
        variables: template.variables,
        version: template.version,
        exported_at: new Date().toISOString(),
    };

    return JSON.stringify(exportData, null, 2);
}

/**
 * Parse an imported template JSON
 */
export function parseTemplateImport(
    jsonString: string
): Omit<TemplateExport, "exported_at"> | null {
    try {
        const data = JSON.parse(jsonString);

        // Validate required fields
        if (!data.name || typeof data.name !== "string") {
            throw new Error("Template must have a name");
        }
        if (!data.content || typeof data.content !== "string") {
            throw new Error("Template must have content");
        }

        return {
            name: data.name,
            description: data.description || "",
            template_type: data.template_type || "custom",
            content: data.content,
            variables: data.variables || [],
            version: data.version || 1,
        };
    } catch (err) {
        console.error("Failed to parse template import:", err);
        return null;
    }
}

/**
 * Download a file to the user's computer
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Common template tags for quick insertion
 */
export const COMMON_TAGS = [
    { label: "Chief Complaint", value: "<Chief Complaint>" },
    { label: "Health History", value: "<Health History Updates>" },
    { label: "Clinical Findings", value: "<Clinical Findings>" },
    { label: "Procedures", value: "<Procedures Performed>" },
    { label: "Recommendations", value: "<Recommendations>" },
    { label: "Follow-up", value: "<Follow-up Instructions>" },
    { label: "Patient Education", value: "<Patient Education>" },
    { label: "Medications", value: "<Medications Prescribed>" },
];

/**
 * Common Jinja2 variables for quick insertion
 */
export const COMMON_JINJA_VARS = [
    { label: "Date", value: "{{ date }}" },
    { label: "Provider", value: "{{ provider }}" },
    { label: "Patient Ref", value: "{{ patient_ref }}" },
    { label: "Chief Complaint", value: "{{ chief_complaint }}" },
    { label: "Summary", value: "{{ summary }}" },
    { label: "Findings (bullets)", value: "{{ findings | bullet_list }}" },
    { label: "Procedures (bullets)", value: "{{ procedures | bullet_list }}" },
    { label: "Recommendations (numbered)", value: "{{ recommendations | numbered_list }}" },
];

