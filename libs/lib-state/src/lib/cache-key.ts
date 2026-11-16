/** Stable logical keys, independent of API URL ordering. Never include secrets. */
export type CacheParams = Record<string, string | number | boolean | null | undefined>;
export function cacheKey(feature: string, resource: string, scope: string, params: CacheParams = {}): string {
  if (!feature || !resource || !scope) throw new Error('A cache feature, resource and scope are required');
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  return [feature, resource, scope, query].map(encodeURIComponent).join(':');
}
