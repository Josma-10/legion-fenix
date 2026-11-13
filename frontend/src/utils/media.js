export function resolveAssetUrl(url, fallback = '/assets/avatar-player.svg') {
  if (!url) return fallback;
  const trimmed = String(url).trim();
  if (!trimmed) return fallback;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  if (trimmed.startsWith('/uploads/')) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    const origin = apiBase.replace(/\/api\/?$/, '');
    return `${origin}${trimmed}`;
  }
  return trimmed;
}
