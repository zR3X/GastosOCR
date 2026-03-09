import React, { createContext, useContext, useState } from 'react';

const CLOUD_NAME_KEY = 'gastos_cld_cloud';
const API_KEY_KEY    = 'gastos_cld_apikey';
const API_SECRET_KEY = 'gastos_cld_secret';

const ENV_CLOUD  = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME  ?? '';
const ENV_KEY    = import.meta.env.VITE_CLOUDINARY_API_KEY     ?? '';
const ENV_SECRET = import.meta.env.VITE_CLOUDINARY_API_SECRET  ?? '';
const ALL_FROM_ENV = !!ENV_CLOUD && !!ENV_KEY && !!ENV_SECRET;

interface CloudinaryContextType {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  setConfig: (cloudName: string, apiKey: string, apiSecret: string) => void;
  hasConfig: boolean;
  fromEnv: boolean;
}

const CloudinaryContext = createContext<CloudinaryContextType | null>(null);

export function CloudinaryProvider({ children }: { children: React.ReactNode }) {
  const [cloudName, setCloudName] = useState(() =>
    ALL_FROM_ENV ? ENV_CLOUD : (localStorage.getItem(CLOUD_NAME_KEY) ?? ''),
  );
  const [apiKey, setApiKey] = useState(() =>
    ALL_FROM_ENV ? ENV_KEY : (localStorage.getItem(API_KEY_KEY) ?? ''),
  );
  const [apiSecret, setApiSecret] = useState(() =>
    ALL_FROM_ENV ? ENV_SECRET : (localStorage.getItem(API_SECRET_KEY) ?? ''),
  );

  const setConfig = (name: string, key: string, secret: string) => {
    if (ALL_FROM_ENV) return; // don't override env vars at runtime
    const n = name.trim(); const k = key.trim(); const s = secret.trim();
    localStorage.setItem(CLOUD_NAME_KEY,  n);
    localStorage.setItem(API_KEY_KEY,     k);
    // only update secret if a new one was provided
    if (s) localStorage.setItem(API_SECRET_KEY, s);
    setCloudName(n);
    setApiKey(k);
    if (s) setApiSecret(s);
  };

  return (
    <CloudinaryContext.Provider
      value={{
        cloudName, apiKey, apiSecret, setConfig,
        hasConfig: !!cloudName && !!apiKey && !!apiSecret,
        fromEnv: ALL_FROM_ENV,
      }}
    >
      {children}
    </CloudinaryContext.Provider>
  );
}

export function useCloudinary() {
  const ctx = useContext(CloudinaryContext);
  if (!ctx) throw new Error('useCloudinary must be used within CloudinaryProvider');
  return ctx;
}
