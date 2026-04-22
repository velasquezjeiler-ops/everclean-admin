'use client';
import { useState, useRef, useEffect } from 'react';
import { LANGUAGE_OPTIONS } from './useTranslation';

export default function LanguageSelector({ lang, setLang }: { lang: string; setLang: (code: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const current = LANGUAGE_OPTIONS.find(l => l.code === lang) || LANGUAGE_OPTIONS[0];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all"
      >
        <span className="text-base">{current.flag}</span>
        <span className="flex-1 text-left text-xs">{current.label}</span>
        <span className="text-xs text-gray-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50 max-h-60 overflow-y-auto">
          {LANGUAGE_OPTIONS.map(opt => (
            <button
              key={opt.code}
              onClick={() => { setLang(opt.code); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-all ${lang === opt.code ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-600'}`}
            >
              <span>{opt.flag}</span>
              <span>{opt.label}</span>
              {lang === opt.code && <span className="ml-auto text-emerald-500">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
