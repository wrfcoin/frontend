/**
 * Map tile provider (frontend#297).
 *
 * Every Leaflet map in the app used to hard-code CARTO's `dark_all` basemap
 * (`{s}.basemaps.cartocdn.com`), which now requires an API key and renders an
 * "API KEY REQUIRED" watermark over every tile without one. Nothing in this
 * repo provisions that key, so `/map` and every other map shipped broken.
 *
 * Default: OpenStreetMap's standard keyless tile server (light style, no
 * retina `{r}` variant, no `{s}` subdomains — tile.openstreetmap.org is a
 * single host). Override both values through the environment to point at a
 * keyed provider (CARTO, MapTiler, Stadia…) for a deployment that has one:
 *
 *   VITE_MAP_TILE_URL=https://…/{z}/{x}/{y}.png?api_key=…
 *   VITE_MAP_TILE_ATTRIBUTION=&copy; <a href="…">Provider</a>
 *
 * Note the OSM tile usage policy (https://operations.osmfoundation.org/policies/tiles/):
 * fine for a testnet's traffic, not for heavy production use — set the
 * override before that point.
 *
 * `import.meta` is guarded because this repo's Jest ESM setup has no
 * `import.meta.env`.
 */

export interface MapTileConfig {
  /** Leaflet tile URL template. */
  url: string;
  /** HTML attribution string Leaflet renders in the map corner. */
  attribution: string;
  /** True when the URL came from the environment rather than the default. */
  fromEnvironment: boolean;
}

export const DEFAULT_MAP_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const DEFAULT_MAP_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

type EnvLike = Record<string, string | boolean | undefined>;

const trimmed = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  return t.length > 0 ? t : null;
};

/** Pure resolver, exported for tests. */
export function resolveMapTiles(env: EnvLike): MapTileConfig {
  const url = trimmed(env.VITE_MAP_TILE_URL);
  const attribution = trimmed(env.VITE_MAP_TILE_ATTRIBUTION);
  if (url) {
    return {
      url,
      // A custom provider must carry its own attribution; fall back to the
      // OSM one only because most providers are OSM-derived.
      attribution: attribution ?? DEFAULT_MAP_TILE_ATTRIBUTION,
      fromEnvironment: true,
    };
  }
  return { url: DEFAULT_MAP_TILE_URL, attribution: DEFAULT_MAP_TILE_ATTRIBUTION, fromEnvironment: false };
}

const ENV: EnvLike =
  (typeof import.meta !== 'undefined' && (import.meta as { env?: EnvLike }).env) || {};

export const MAP_TILES: MapTileConfig = resolveMapTiles(ENV);
export const MAP_TILE_URL = MAP_TILES.url;
export const MAP_TILE_ATTRIBUTION = MAP_TILES.attribution;
