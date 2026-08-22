'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTranslation, Language } from '../../lib/i18n';

type Preference = any;

interface SettingsContextType {
  preferences: Preference;
  setPreferences: React.Dispatch<React.SetStateAction<Preference>>;
  t: (key: string) => string;
  lang: Language;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<Preference>({
    theme: 'SYSTEM',
    language: 'EN'
  });

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'}/api/preferences`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data && d.data.preferences) {
          setPreferences(d.data.preferences);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark', 'theme-hacker');
    
    let activeTheme = preferences.theme || 'SYSTEM';
    if (activeTheme === 'SYSTEM') {
      activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'DARK' : 'LIGHT';
    }

    if (activeTheme === 'DARK') {
      root.classList.add('dark');
    } else if (activeTheme === 'HACKER') {
      root.classList.add('dark', 'theme-hacker');
    }
  }, [preferences.theme]);

  const lang: Language = preferences.language === 'BN' ? 'BN' : 'EN';
  const t = (key: string) => getTranslation(lang, key as any);

  return (
    <SettingsContext.Provider value={{ preferences, setPreferences, t, lang }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
