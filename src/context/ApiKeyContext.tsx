import React, { createContext, useContext, useState } from 'react';

const STORAGE_KEY = 'gastos_openai_key';
const ENV_VALUE   = import.meta.env.VITE_OPENAI_API_KEY ?? '';

interface ApiKeyContextType {
  apiKey: string;
  setApiKey: (key: string) => void;
  hasKey: boolean;
  fromEnv: boolean; // true when value comes from .env
}

const ApiKeyContext = createContext<ApiKeyContextType | null>(null);

export function ApiKeyProvider({ children }: { children: React.ReactNode }) {
  // .env takes priority; fallback to localStorage
  const [apiKey, setApiKeyState] = useState<string>(() => {
    if (ENV_VALUE.length > 10) return ENV_VALUE;
    return localStorage.getItem(STORAGE_KEY) ?? '';
  });

  const fromEnv = ENV_VALUE.length > 10;

  const setApiKey = (key: string) => {
    if (fromEnv) return; // don't override env var at runtime
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setApiKeyState(trimmed);
  };

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, hasKey: apiKey.length > 10, fromEnv }}>
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey() {
  const ctx = useContext(ApiKeyContext);
  if (!ctx) throw new Error('useApiKey must be used within ApiKeyProvider');
  return ctx;
}
