export const FALLBACK_API_BASE = 'https://commercial-clean-setup.replit.app/api';

function cleanBase(value?: string | null) {
  return (value || '').replace(/\/$/, '');
}

export function getApiBase() {
  if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_API_URL || FALLBACK_API_BASE;
  return (
    cleanBase(localStorage.getItem('apiBase')) ||
    cleanBase(process.env.NEXT_PUBLIC_API_URL) ||
    FALLBACK_API_BASE
  );
}

export function rememberApiBase(base: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('apiBase', cleanBase(base) || '/api');
}

export function getLoginBases() {
  const configured = cleanBase(process.env.NEXT_PUBLIC_API_URL);
  return Array.from(new Set(['/api', configured, FALLBACK_API_BASE].filter(Boolean)));
}
