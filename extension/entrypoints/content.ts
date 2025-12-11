/**
 * Content script
 * Handles note insertion into the active page
 */
export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('NoteSmith content script loaded');

    // Listen for insertion commands from background/popup
    browser.runtime.onMessage.addListener((message) => {
      if (message.type === 'DO_INSERT') {
        insertIntoActiveElement(message.content);
      }
    });
  },
});

/**
 * Insert text into the currently focused element
 * Works with textareas, inputs, and contenteditable elements
 */
function insertIntoActiveElement(content: string) {
  const activeElement = document.activeElement;

  if (!activeElement) {
    showNotification('No field is focused. Click on a text field first.');
    return;
  }

  // Handle textarea and input elements
  if (activeElement instanceof HTMLTextAreaElement || activeElement instanceof HTMLInputElement) {
    const start = activeElement.selectionStart ?? 0;
    const end = activeElement.selectionEnd ?? 0;
    const value = activeElement.value;

    activeElement.value = value.slice(0, start) + content + value.slice(end);

    // Trigger input event for React/Vue/Angular compatibility
    activeElement.dispatchEvent(new Event('input', { bubbles: true }));
    activeElement.dispatchEvent(new Event('change', { bubbles: true }));

    showNotification('Note inserted successfully!');
    return;
  }

  // Handle contenteditable elements
  if (activeElement.getAttribute('contenteditable') === 'true') {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(content));
    } else {
      activeElement.textContent += content;
    }

    activeElement.dispatchEvent(new Event('input', { bubbles: true }));
    showNotification('Note inserted successfully!');
    return;
  }

  showNotification('Cannot insert into this element. Try a text field.');
}

/**
 * Show a brief notification toast
 */
function showNotification(message: string) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #16a34a;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-family: system-ui, sans-serif;
    font-size: 14px;
    z-index: 999999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease;
  `;

  // Add animation keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

