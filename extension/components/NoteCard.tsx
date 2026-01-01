import { useState } from 'react';
import type { Note } from '../lib/types';

interface NoteCardProps {
  note: Note;
  onInsert: () => void;
  onCopy: () => void;
}

export function NoteCard({ note, onInsert, onCopy }: NoteCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const preview = note.content.slice(0, 100) + (note.content.length > 100 ? '...' : '');

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div
        className="px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {note.patientName || 'Unknown Patient'}
            </h3>
            <p className="text-xs text-gray-500">{note.appointmentDate}</p>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {!expanded && (
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{preview}</p>
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-gray-100">
          <pre className="text-xs text-gray-700 whitespace-pre-wrap mt-2 max-h-48 overflow-y-auto bg-gray-50 p-2 rounded">
            {note.content}
          </pre>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={onInsert}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded hover:bg-primary-700 transition-colors"
            >
              Insert into Field
            </button>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

