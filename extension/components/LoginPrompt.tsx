interface LoginPromptProps {
  onLogin: () => void;
}

export function LoginPrompt({ onLogin }: LoginPromptProps) {
  async function handleLogin() {
    // Open NoteSmith web app for authentication
    // The web app will send the token back via message
    const authUrl = await getAuthUrl();

    browser.tabs.create({ url: authUrl });

    // Listen for auth completion
    const listener = (message: { type: string }) => {
      if (message.type === 'AUTH_COMPLETE') {
        browser.runtime.onMessage.removeListener(listener);
        onLogin();
      }
    };
    browser.runtime.onMessage.addListener(listener);
  }

  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
        <svg
          className="w-8 h-8 text-primary-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-2">Sign in to NoteSmith</h2>
      <p className="text-sm text-gray-600 mb-6">
        Connect your account to access and insert clinical notes.
      </p>

      <button
        onClick={handleLogin}
        className="w-full px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
      >
        Sign in with NoteSmith
      </button>
    </div>
  );
}

async function getAuthUrl(): Promise<string> {
  // TODO: Get from config or environment
  const baseUrl = 'http://localhost:3000';
  const extensionId = browser.runtime.id;
  return `${baseUrl}/auth/extension?ext_id=${extensionId}`;
}

