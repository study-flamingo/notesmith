import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    tokenizeTemplate,
    extractPlaceholders,
    exportTemplate,
    parseTemplateImport,
    COMMON_TAGS,
    COMMON_JINJA_VARS,
    type HighlightToken,
} from "../template-utils";
import type { Template } from "../api";

describe("tokenizeTemplate", () => {
    it("returns text tokens for plain text", () => {
        const tokens = tokenizeTemplate("Hello World");
        expect(tokens).toHaveLength(1);
        expect(tokens[0]).toEqual({
            type: "text",
            value: "Hello World",
            start: 0,
            end: 11,
        });
    });

    it("identifies tag placeholders", () => {
        const tokens = tokenizeTemplate("The <Patient Name> was seen.");
        expect(tokens).toHaveLength(3);
        expect(tokens[1]).toMatchObject({
            type: "tag",
            value: "<Patient Name>",
        });
    });

    it("identifies Jinja2 variable placeholders", () => {
        const tokens = tokenizeTemplate("Hello {{ name }}!");
        expect(tokens).toHaveLength(3);
        expect(tokens[1]).toMatchObject({
            type: "jinja-var",
            value: "{{ name }}",
        });
    });

    it("identifies Jinja2 block statements", () => {
        const tokens = tokenizeTemplate("{% if condition %}Show{% endif %}");
        expect(tokens.some((t) => t.type === "jinja-block" && t.value.includes("if"))).toBe(true);
        expect(tokens.some((t) => t.type === "jinja-block" && t.value.includes("endif"))).toBe(true);
    });

    it("handles multiple placeholder types in one template", () => {
        const template = `
<Chief Complaint>
{{ procedures | bullet_list }}
{% if has_findings %}
Findings: {{ findings }}
{% endif %}
`;
        const tokens = tokenizeTemplate(template);

        const types = tokens.map((t) => t.type);
        expect(types).toContain("tag");
        expect(types).toContain("jinja-var");
        expect(types).toContain("jinja-block");
        expect(types).toContain("text");
    });

    it("correctly tracks token positions", () => {
        const template = "Start {{ name }} end";
        const tokens = tokenizeTemplate(template);

        expect(tokens[0]).toMatchObject({ start: 0, end: 6, value: "Start " });
        expect(tokens[1]).toMatchObject({ start: 6, end: 16, value: "{{ name }}" });
        expect(tokens[2]).toMatchObject({ start: 16, end: 20, value: " end" });
    });

    it("handles empty string", () => {
        const tokens = tokenizeTemplate("");
        expect(tokens).toHaveLength(0);
    });

    it("handles template with only placeholders", () => {
        const tokens = tokenizeTemplate("{{ first }}{{ second }}");
        expect(tokens).toHaveLength(2);
        expect(tokens.every((t) => t.type === "jinja-var")).toBe(true);
    });

    it("handles Jinja2 filters", () => {
        const tokens = tokenizeTemplate("{{ items | bullet_list }}");
        expect(tokens).toHaveLength(1);
        expect(tokens[0].type).toBe("jinja-var");
        expect(tokens[0].value).toBe("{{ items | bullet_list }}");
    });

    it("handles for loops", () => {
        const tokens = tokenizeTemplate("{% for item in items %}{{ item }}{% endfor %}");
        expect(tokens.some((t) => t.type === "jinja-block" && t.value.includes("for"))).toBe(true);
        expect(tokens.some((t) => t.type === "jinja-block" && t.value.includes("endfor"))).toBe(true);
    });
});

describe("extractPlaceholders", () => {
    it("extracts tag-based placeholders", () => {
        const placeholders = extractPlaceholders("<Chief Complaint> and <Findings>");
        expect(placeholders).toContain("Chief Complaint");
        expect(placeholders).toContain("Findings");
    });

    it("extracts Jinja2 variable placeholders", () => {
        const placeholders = extractPlaceholders("{{ name }} and {{ date }}");
        expect(placeholders).toContain("name");
        expect(placeholders).toContain("date");
    });

    it("extracts variable names without filters", () => {
        const placeholders = extractPlaceholders("{{ items | bullet_list }}");
        expect(placeholders).toContain("items");
        expect(placeholders).not.toContain("bullet_list");
    });

    it("returns unique placeholders", () => {
        const placeholders = extractPlaceholders("{{ name }} says {{ name }}");
        expect(placeholders.filter((p) => p === "name")).toHaveLength(1);
    });

    it("handles empty template", () => {
        const placeholders = extractPlaceholders("");
        expect(placeholders).toHaveLength(0);
    });

    it("handles template with no placeholders", () => {
        const placeholders = extractPlaceholders("Just plain text here.");
        expect(placeholders).toHaveLength(0);
    });

    it("handles mixed placeholder types", () => {
        const template = "<Chief Complaint>\n{{ procedures | bullet_list }}\n{{ date }}";
        const placeholders = extractPlaceholders(template);
        expect(placeholders).toContain("Chief Complaint");
        expect(placeholders).toContain("procedures");
        expect(placeholders).toContain("date");
    });
});

describe("exportTemplate", () => {
    const mockTemplate: Template = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "Test Template",
        description: "A test template",
        template_type: "soap",
        content: "{{ chief_complaint }}",
        variables: [{ name: "chief_complaint", description: "The main complaint", required: true }],
        is_default: false,
        is_active: true,
        version: 1,
        created_at: "2024-01-01T00:00:00Z",
    };

    it("exports template as JSON string", () => {
        const result = exportTemplate(mockTemplate);
        expect(typeof result).toBe("string");

        const parsed = JSON.parse(result);
        expect(parsed.name).toBe("Test Template");
    });

    it("includes all required fields", () => {
        const result = exportTemplate(mockTemplate);
        const parsed = JSON.parse(result);

        expect(parsed).toHaveProperty("name");
        expect(parsed).toHaveProperty("description");
        expect(parsed).toHaveProperty("template_type");
        expect(parsed).toHaveProperty("content");
        expect(parsed).toHaveProperty("variables");
        expect(parsed).toHaveProperty("version");
        expect(parsed).toHaveProperty("exported_at");
    });

    it("includes valid exported_at timestamp", () => {
        const before = new Date();
        const result = exportTemplate(mockTemplate);
        const after = new Date();
        const parsed = JSON.parse(result);

        const exportedAt = new Date(parsed.exported_at);
        expect(exportedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(exportedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("preserves variables array", () => {
        const result = exportTemplate(mockTemplate);
        const parsed = JSON.parse(result);

        expect(parsed.variables).toHaveLength(1);
        expect(parsed.variables[0].name).toBe("chief_complaint");
    });

    it("produces formatted JSON", () => {
        const result = exportTemplate(mockTemplate);
        // Should be formatted with 2-space indentation
        expect(result).toContain("\n");
        expect(result).toContain("  ");
    });
});

describe("parseTemplateImport", () => {
    it("parses valid template JSON", () => {
        const json = JSON.stringify({
            name: "Imported Template",
            content: "{{ test }}",
            template_type: "custom",
            version: 1,
        });

        const result = parseTemplateImport(json);
        expect(result).not.toBeNull();
        expect(result?.name).toBe("Imported Template");
        expect(result?.content).toBe("{{ test }}");
    });

    it("returns null for invalid JSON", () => {
        const result = parseTemplateImport("not valid json");
        expect(result).toBeNull();
    });

    it("returns null if name is missing", () => {
        const json = JSON.stringify({
            content: "{{ test }}",
        });
        const result = parseTemplateImport(json);
        expect(result).toBeNull();
    });

    it("returns null if content is missing", () => {
        const json = JSON.stringify({
            name: "Template",
        });
        const result = parseTemplateImport(json);
        expect(result).toBeNull();
    });

    it("sets defaults for optional fields", () => {
        const json = JSON.stringify({
            name: "Minimal Template",
            content: "Content here",
        });

        const result = parseTemplateImport(json);
        expect(result).not.toBeNull();
        expect(result?.description).toBe("");
        expect(result?.template_type).toBe("custom");
        expect(result?.variables).toEqual([]);
        expect(result?.version).toBe(1);
    });

    it("preserves provided optional fields", () => {
        const json = JSON.stringify({
            name: "Full Template",
            content: "Content",
            description: "A description",
            template_type: "soap",
            variables: [{ name: "var", description: "desc", required: true }],
            version: 5,
        });

        const result = parseTemplateImport(json);
        expect(result?.description).toBe("A description");
        expect(result?.template_type).toBe("soap");
        expect(result?.variables).toHaveLength(1);
        expect(result?.version).toBe(5);
    });

    it("does not include exported_at in result", () => {
        const json = JSON.stringify({
            name: "Template",
            content: "Content",
            exported_at: "2024-01-01T00:00:00Z",
        });

        const result = parseTemplateImport(json);
        expect(result).not.toHaveProperty("exported_at");
    });
});

describe("COMMON_TAGS", () => {
    it("contains expected common tags", () => {
        expect(COMMON_TAGS.length).toBeGreaterThan(0);
        expect(COMMON_TAGS.some((t) => t.label === "Chief Complaint")).toBe(true);
        expect(COMMON_TAGS.some((t) => t.label === "Procedures")).toBe(true);
    });

    it("has proper structure for all tags", () => {
        COMMON_TAGS.forEach((tag) => {
            expect(tag).toHaveProperty("label");
            expect(tag).toHaveProperty("value");
            expect(typeof tag.label).toBe("string");
            expect(typeof tag.value).toBe("string");
            expect(tag.value.startsWith("<")).toBe(true);
            expect(tag.value.endsWith(">")).toBe(true);
        });
    });
});

describe("COMMON_JINJA_VARS", () => {
    it("contains expected Jinja variables", () => {
        expect(COMMON_JINJA_VARS.length).toBeGreaterThan(0);
        expect(COMMON_JINJA_VARS.some((v) => v.label === "Date")).toBe(true);
        expect(COMMON_JINJA_VARS.some((v) => v.label === "Provider")).toBe(true);
    });

    it("has proper Jinja2 syntax for all values", () => {
        COMMON_JINJA_VARS.forEach((variable) => {
            expect(variable).toHaveProperty("label");
            expect(variable).toHaveProperty("value");
            expect(variable.value).toMatch(/\{\{.*\}\}/);
        });
    });
});

