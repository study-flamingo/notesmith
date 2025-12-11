"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  ChangeEvent,
} from "react";
import {
  ChevronDown,
  Eye,
  EyeOff,
  Tag,
  Code,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  tokenizeTemplate,
  HighlightToken,
  COMMON_TAGS,
  COMMON_JINJA_VARS,
} from "@/lib/template-utils";

interface TemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showPreview?: boolean;
  disabled?: boolean;
}

/**
 * Template editor with syntax highlighting overlay and tag insertion toolbar
 */
export function TemplateEditor({
  value,
  onChange,
  placeholder = "Enter template content...",
  className,
  showPreview: initialShowPreview = false,
  disabled = false,
}: TemplateEditorProps) {
  const [showPreview, setShowPreview] = useState(initialShowPreview);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showJinjaDropdown, setShowJinjaDropdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Sync scroll between textarea and highlight overlay
  const handleScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  // Insert text at cursor position
  const insertAtCursor = useCallback(
    (text: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.slice(0, start) + text + value.slice(end);

      onChange(newValue);

      // Restore cursor position after the inserted text
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.selectionStart = start + text.length;
        textarea.selectionEnd = start + text.length;
      });

      setShowTagDropdown(false);
      setShowJinjaDropdown(false);
    },
    [value, onChange]
  );

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest(".dropdown-container")) {
        setShowTagDropdown(false);
        setShowJinjaDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {/* Tag insertion dropdown */}
          <div className="relative dropdown-container">
            <button
              type="button"
              onClick={() => {
                setShowTagDropdown(!showTagDropdown);
                setShowJinjaDropdown(false);
              }}
              disabled={disabled}
              className="btn btn-secondary text-sm"
            >
              <Tag className="w-4 h-4 mr-1.5" />
              Insert Tag
              <ChevronDown className="w-4 h-4 ml-1.5" />
            </button>
            {showTagDropdown && (
              <div className="absolute left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-clinical-200 py-1 z-20 max-h-64 overflow-y-auto">
                <div className="px-3 py-2 text-xs font-medium text-clinical-500 uppercase tracking-wider">
                  Common Tags
                </div>
                {COMMON_TAGS.map((tag) => (
                  <button
                    key={tag.value}
                    type="button"
                    onClick={() => insertAtCursor(tag.value)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-clinical-700 hover:bg-clinical-50 text-left"
                  >
                    <span className="text-blue-600 font-mono text-xs">
                      {tag.value}
                    </span>
                    <span className="text-clinical-500">{tag.label}</span>
                  </button>
                ))}
                <div className="border-t border-clinical-100 mt-1 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const customTag = prompt("Enter custom tag name:");
                      if (customTag) {
                        insertAtCursor(`<${customTag}>`);
                      }
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-dental-600 hover:bg-clinical-50"
                  >
                    <Plus className="w-4 h-4" />
                    Custom Tag...
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Jinja variable insertion dropdown */}
          <div className="relative dropdown-container">
            <button
              type="button"
              onClick={() => {
                setShowJinjaDropdown(!showJinjaDropdown);
                setShowTagDropdown(false);
              }}
              disabled={disabled}
              className="btn btn-secondary text-sm"
            >
              <Code className="w-4 h-4 mr-1.5" />
              Insert Variable
              <ChevronDown className="w-4 h-4 ml-1.5" />
            </button>
            {showJinjaDropdown && (
              <div className="absolute left-0 mt-1 w-72 bg-white rounded-lg shadow-lg border border-clinical-200 py-1 z-20 max-h-64 overflow-y-auto">
                <div className="px-3 py-2 text-xs font-medium text-clinical-500 uppercase tracking-wider">
                  Jinja2 Variables
                </div>
                {COMMON_JINJA_VARS.map((v) => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => insertAtCursor(v.value)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-clinical-700 hover:bg-clinical-50 text-left"
                  >
                    <span className="text-purple-600 font-mono text-xs shrink-0">
                      {v.value}
                    </span>
                    <span className="text-clinical-500 truncate">{v.label}</span>
                  </button>
                ))}
                <div className="border-t border-clinical-100 mt-1 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const customVar = prompt("Enter variable name:");
                      if (customVar) {
                        insertAtCursor(`{{ ${customVar} }}`);
                      }
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-dental-600 hover:bg-clinical-50"
                  >
                    <Plus className="w-4 h-4" />
                    Custom Variable...
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview toggle */}
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="btn btn-ghost text-sm"
        >
          {showPreview ? (
            <>
              <EyeOff className="w-4 h-4 mr-1.5" />
              Hide Preview
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-1.5" />
              Show Preview
            </>
          )}
        </button>
      </div>

      {/* Editor area */}
      <div
        className={cn(
          "grid gap-4",
          showPreview ? "md:grid-cols-2" : "grid-cols-1"
        )}
      >
        {/* Editor with syntax highlighting overlay */}
        <div className="relative">
          <div className="relative rounded-lg border border-clinical-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-dental-500 focus-within:border-dental-500">
            {/* Syntax highlight overlay */}
            <div
              ref={highlightRef}
              className="absolute inset-0 p-3 font-mono text-sm whitespace-pre-wrap break-words pointer-events-none overflow-hidden"
              aria-hidden="true"
            >
              <HighlightedContent content={value || placeholder} isPlaceholder={!value} />
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              onScroll={handleScroll}
              placeholder={placeholder}
              disabled={disabled}
              spellCheck={false}
              className={cn(
                "relative w-full min-h-[400px] p-3 font-mono text-sm resize-y",
                "bg-transparent text-transparent caret-clinical-900",
                "placeholder:text-clinical-400",
                "focus:outline-none",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            />
          </div>
          <p className="mt-2 text-xs text-clinical-500">
            Use <code className="text-blue-600">&lt;Tag Name&gt;</code> for simple placeholders or{" "}
            <code className="text-purple-600">{"{{ variable }}"}</code> for Jinja2 syntax.
          </p>
        </div>

        {/* Preview panel */}
        {showPreview && (
          <div>
            <div className="text-sm font-medium text-clinical-700 mb-2">Preview</div>
            <div className="rounded-lg border border-clinical-200 bg-clinical-50 p-3 min-h-[400px] max-h-[500px] overflow-auto">
              <pre className="font-mono text-sm whitespace-pre-wrap break-words">
                <HighlightedContent content={value || "No content"} isPlaceholder={!value} />
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Highlighted content display
 */
function HighlightedContent({
  content,
  isPlaceholder = false,
}: {
  content: string;
  isPlaceholder?: boolean;
}) {
  const tokens = useMemo(() => tokenizeTemplate(content), [content]);

  if (isPlaceholder) {
    return <span className="text-clinical-400">{content}</span>;
  }

  return (
    <>
      {tokens.map((token, index) => (
        <TokenSpan key={index} token={token} />
      ))}
    </>
  );
}

function TokenSpan({ token }: { token: HighlightToken }) {
  const getTokenStyle = (type: HighlightToken["type"]) => {
    switch (type) {
      case "tag":
        return "bg-blue-100 text-blue-700 rounded px-0.5 font-semibold";
      case "jinja-var":
        return "bg-purple-100 text-purple-700 rounded px-0.5";
      case "jinja-block":
        return "bg-emerald-100 text-emerald-700 rounded px-0.5 italic";
      default:
        return "text-clinical-700";
    }
  };

  return <span className={getTokenStyle(token.type)}>{token.value}</span>;
}



