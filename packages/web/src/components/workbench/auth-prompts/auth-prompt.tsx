import React from 'react';

interface AuthPromptProps {
  onSubmit: (token: string) => void;
  authHint?: string;
}

/**
 * Generic auth prompt for token input
 */
export function AuthPrompt({ onSubmit, authHint }: AuthPromptProps) {
  const [token, setToken] = React.useState('');

  const handle = () => {
    if (token.trim()) {
      onSubmit(token.trim());
      setToken('');
    }
  };

  const placeholder = authHint ? `${authHint.toUpperCase()} token` : 'Enter token...';

  return (
    <div className="mt-4 flex items-center gap-2">
      <input
        type="password"
        placeholder={placeholder}
        value={token}
        onChange={(e) => setToken(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handle();
          }
        }}
        className="flex-1 border rounded px-2 py-1 text-sm"
      />
      <button
        onClick={handle}
        className="bg-gray-900 text-white text-sm px-3 py-1 rounded hover:bg-gray-800"
      >
        Retry
      </button>
    </div>
  );
}
