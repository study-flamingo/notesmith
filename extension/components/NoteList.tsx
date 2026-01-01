import { useState, useEffect } from 'react';
import { NoteCard } from './NoteCard';
import { api } from '../lib/api';
import type { Note } from '../lib/types';

export function NoteList() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadNotes();
  }, []);

  async function loadNotes() {
    try {
      setLoading(true);
      const data = await api.getNotes();
      setNotes(data);
      setError(null);
    } catch (err) {
      setError('Failed to load notes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleInsert(noteId: string) {
    await browser.runtime.sendMessage({ type: 'INSERT_NOTE', noteId });
  }

  async function handleCopy(content: string) {
    await navigator.clipboard.writeText(content);
  }

  const filteredNotes = notes.filter(
    (note) =>
      note.patientName?.toLowerCase().includes(search.toLowerCase()) ||
      note.appointmentDate?.includes(search)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-2">{error}</p>
        <button
          onClick={loadNotes}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by patient or date..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 pl-9 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <svg
          className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Notes */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No notes found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onInsert={() => handleInsert(note.id)}
              onCopy={() => handleCopy(note.content)}
            />
          ))}
        </div>
      )}

      {/* Refresh button */}
      <button
        onClick={loadNotes}
        className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        ↻ Refresh
      </button>
    </div>
  );
}

