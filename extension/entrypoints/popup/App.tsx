import { useState, useEffect } from 'react';
import { NoteList } from '../../components/NoteList';
import { LoginPrompt } from '../../components/LoginPrompt';
import { storage } from '../../lib/storage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const token = await storage.getAccessToken();
    setIsAuthenticated(!!token);
  }

  async function handleLogout() {
    await storage.clearAuth();
    setIsAuthenticated(false);
  }

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-[400px]">
      {/* Header */}
      <header className="bg-primary-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="font-semibold">NoteSmith</span>
        </div>
        {isAuthenticated && (
          <button
            onClick={handleLogout}
            className="text-xs text-primary-100 hover:text-white transition-colors"
          >
            Logout
          </button>
        )}
      </header>

      {/* Content */}
      <main className="p-4">
        {isAuthenticated ? (
          <NoteList />
        ) : (
          <LoginPrompt onLogin={() => setIsAuthenticated(true)} />
        )}
      </main>
    </div>
  );
}

