export const FALLBACK_API_BASE = 'https://commercial-clean-setup.replit.app/api';
const LEGACY_API_BASE = 'https://commercial-clean-setup--velasquezjeiler.replit.app/api';

function cleanBase(value?: string | null) {
  return value ? value.replace(/\/$/, '') : '';
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export function getApiBase() {
  if (typeof window !== 'undefined') {
    const override = cleanBase(localStorage.getItem('everclean_api_base'));
    return override || '/api';
  }
  return cleanBase(process.env.NEXT_PUBLIC_API_URL) || FALLBACK_API_BASE;
}

export function getLoginBases() {
  const configured = cleanBase(process.env.NEXT_PUBLIC_API_URL);
  const saved =
    typeof window !== 'undefined'
      ? cleanBase(localStorage.getItem('everclean_api_base'))
      : '';

  return unique([
    saved,
    '/api',
    configured,
    FALLBACK_API_BASE,
    LEGACY_API_BASE,
  ]);
}

export function rememberApiBase(base: string) {
  if (typeof window === 'undefined') return;
  const cleaned = cleanBase(base);
  if (!cleaned || cleaned === '/api') {
    localStorage.removeItem('everclean_api_base');
    return;
  }
  localStorage.setItem('everclean_api_base', cleaned);
}
