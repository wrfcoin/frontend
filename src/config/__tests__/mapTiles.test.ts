/**
 * frontend#297 — every Leaflet map hard-coded CARTO's dark_all basemap, which
 * now requires an API key nothing in this repo provisions, so every map
 * rendered an "API KEY REQUIRED" watermark. Tiles come from one config module
 * with a keyless default and an environment override.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_MAP_TILE_ATTRIBUTION,
  DEFAULT_MAP_TILE_URL,
  MAP_TILE_ATTRIBUTION,
  MAP_TILE_URL,
  resolveMapTiles,
} from '../mapTiles';

describe('resolveMapTiles', () => {
  it('defaults to the keyless OpenStreetMap tile server with OSM attribution', () => {
    const config = resolveMapTiles({});
    expect(config).toEqual({
      url: DEFAULT_MAP_TILE_URL,
      attribution: DEFAULT_MAP_TILE_ATTRIBUTION,
      fromEnvironment: false,
    });
    expect(config.url).not.toMatch(/cartocdn|api_key|\{s\}|\{r\}/);
    expect(config.url).toMatch(/^https:\/\/tile\.openstreetmap\.org\/\{z\}\/\{x\}\/\{y\}\.png$/);
    expect(config.attribution).toMatch(/openstreetmap\.org\/copyright/);
  });

  it('honours a keyed provider from the environment, with its own attribution', () => {
    const config = resolveMapTiles({
      VITE_MAP_TILE_URL: ' https://tiles.example.com/{z}/{x}/{y}.png?api_key=abc ',
      VITE_MAP_TILE_ATTRIBUTION: '&copy; Example',
    });
    expect(config).toEqual({
      url: 'https://tiles.example.com/{z}/{x}/{y}.png?api_key=abc',
      attribution: '&copy; Example',
      fromEnvironment: true,
    });
  });

  it('ignores a blank override and never lets an attribution override apply without a URL', () => {
    expect(resolveMapTiles({ VITE_MAP_TILE_URL: '   ', VITE_MAP_TILE_ATTRIBUTION: 'x' }).fromEnvironment).toBe(false);
    expect(resolveMapTiles({ VITE_MAP_TILE_URL: 'https://t.example/{z}/{x}/{y}.png' }).attribution).toBe(
      DEFAULT_MAP_TILE_ATTRIBUTION,
    );
  });

  it('module constants resolve under Jest (no import.meta.env) to the default', () => {
    expect(MAP_TILE_URL).toBe(DEFAULT_MAP_TILE_URL);
    expect(MAP_TILE_ATTRIBUTION).toBe(DEFAULT_MAP_TILE_ATTRIBUTION);
  });
});

describe('acceptance gate: no component hard-codes a tile provider', () => {
  const srcRoot = fileURLToPath(new URL('../../', import.meta.url));
  const walk = (dir: string, out: string[] = []): string[] => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (entry === 'node_modules' || entry === '__tests__' || entry === 'stories') continue;
      if (statSync(full).isDirectory()) walk(full, out);
      else if (/\.(jsx?|tsx?)$/.test(entry)) out.push(full);
    }
    return out;
  };

  it('every <TileLayer> carries the attribution and no map hides the attribution control (OSM tile policy)', () => {
    const offenders: string[] = [];
    for (const file of walk(srcRoot)) {
      const text = readFileSync(file, 'utf8');
      if (/attributionControl=\{false\}/.test(text)) offenders.push(`${file}: attributionControl={false}`);
      for (const m of text.matchAll(/<TileLayer\b([^>]*)>/gs)) {
        if (!/attribution/.test(m[1])) offenders.push(`${file}: <TileLayer> without attribution`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('no source file outside config/mapTiles.ts references cartocdn or an inline tile URL', () => {
    const offenders = walk(srcRoot)
      .filter(file => !file.endsWith(path.join('config', 'mapTiles.ts')))
      .filter(file => /basemaps\.cartocdn\.com|tile\.openstreetmap\.org/.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
