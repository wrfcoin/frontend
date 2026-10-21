/**
 * Geocoding service using OpenStreetMap Nominatim (free, no API key).
 * Debounce should be enforced at the caller (300ms minimum).
 */

export interface GeocodingResult {
  displayName: string;
  lat: number;
  lng: number;
  type: string;
}

const cache = new Map<string, GeocodingResult[]>();

export async function geocodeSearch(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodingResult[]> {
  const key = query.trim().toLowerCase();
  if (key.length < 2) return [];

  const cached = cache.get(key);
  if (cached) return cached;

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(key)}&limit=5&addressdetails=0`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'WRFCoin-Explorer/1.0' },
    signal,
  });

  if (!res.ok) return [];

  const data: Array<{ display_name: string; lat: string; lon: string; type: string }> =
    await res.json();

  const results: GeocodingResult[] = data.map((item) => ({
    displayName: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    type: item.type,
  }));

  cache.set(key, results);
  return results;
}
