export function getApiBase(): string {
  const configured = typeof window === 'undefined'
    ? process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL
    : process.env.NEXT_PUBLIC_API_BASE_URL;
  return configured
    || (process.env.NODE_ENV === 'production'
      ? 'https://gijiraku-backend.onrender.com'
      : 'http://localhost:8000');
}

export function buildApiUrl(path: string): string {
  const base = getApiBase().replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
