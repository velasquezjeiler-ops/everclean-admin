'use client';
import { useState, useEffect, useCallback } from 'react';

import en from './en.json';
import es from './es.json';

const LANGS: Record<string, any> = { en, es };

export const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return path;
    current = current[key];
  }
  return typeof current === 'string' ? current : path;
}

export function useTranslation() {
  const [lang, setLangState] = useState('en');

  useEffect(() => {
    const saved = localStorage.getItem('lang');
    if (saved && LANGS[saved]) setLangState(saved);
  }, []);

  const setLang = useCallback((code: string) => {
    if (LANGS[code]) {
      setLangState(code);
      localStorage.setItem('lang', code);
    }
  }, []);

  const t = useCallback((key: string): string => {
    const translation = getNestedValue(LANGS[lang], key);
    if (translation !== key) return translation;
    return getNestedValue(LANGS['en'], key);
  }, [lang]);

  return { t, lang, setLang };
}
