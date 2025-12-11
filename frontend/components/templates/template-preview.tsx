"use client";

import { useMemo } from "react";
import { tokenizeTemplate, HighlightToken } from "@/lib/template-utils";
import { cn } from "@/lib/utils";

interface TemplatePreviewProps {
  content: string;
  className?: string;
}

/**
 * Renders template content with syntax highlighting for placeholders
 */
export function TemplatePreview({ content, className }: TemplatePreviewProps) {
  const tokens = useMemo(() => tokenizeTemplate(content), [content]);

  return (
    <pre
      className={cn(
        "font-mono text-sm whitespace-pre-wrap break-words bg-clinical-50 rounded-lg p-4 overflow-auto max-h-[600px]",
        className
      )}
    >
      {tokens.map((token, index) => (
        <TokenSpan key={index} token={token} />
      ))}
    </pre>
  );
}

function TokenSpan({ token }: { token: HighlightToken }) {
  const getTokenStyle = (type: HighlightToken["type"]) => {
    switch (type) {
      case "tag":
        return "bg-blue-100 text-blue-700 px-1 rounded font-semibold";
      case "jinja-var":
        return "bg-purple-100 text-purple-700 px-1 rounded";
      case "jinja-block":
        return "bg-emerald-100 text-emerald-700 px-1 rounded italic";
      default:
        return "text-clinical-700";
    }
  };

  return <span className={getTokenStyle(token.type)}>{token.value}</span>;
}

