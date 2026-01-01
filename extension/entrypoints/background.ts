/**
 * Background service worker
 * Handles authentication state and API communication
 */
export default defineBackground(() => {
  console.log('NoteSmith background worker started');

  // Listen for messages from popup or content scripts
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'INSERT_NOTE') {
      handleInsertNote(message.noteId, sender.tab?.id);
      return true;
    }

    if (message.type === 'AUTH_CALLBACK') {
      handleAuthCallback(message.accessToken, message.refreshToken);
      return true;
    }
  });
});

async function handleInsertNote(noteId: string, tabId?: number) {
  if (!tabId) return;

  // Fetch note content from API
  const note = await fetchNote(noteId);
  if (!note) return;

  // Send to content script for insertion
  await browser.tabs.sendMessage(tabId, {
    type: 'DO_INSERT',
    content: note.content,
  });

  // Mark as inserted in backend (audit trail)
  await markNoteInserted(noteId);
}

async function handleAuthCallback(accessToken: string, refreshToken: string) {
  // Store tokens securely
  await browser.storage.session.set({
    accessToken,
    refreshToken,
    tokenExpiry: Date.now() + 3600 * 1000, // 1 hour
  });
}

async function fetchNote(noteId: string) {
  // TODO: Implement API call
  console.log('Fetching note:', noteId);
  return null;
}

async function markNoteInserted(noteId: string) {
  // TODO: Implement API call
  console.log('Marking note as inserted:', noteId);
}

