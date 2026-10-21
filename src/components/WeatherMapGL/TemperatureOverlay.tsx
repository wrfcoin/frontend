import React, { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- @types/leaflet may not be installed
import type { Map as LeafletMap } from 'leaflet';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TempStation {
  lat: number;
  lng: number;
  temperature: number; // Fahrenheit
}

interface TemperatureOverlayProps {
  stations: TempStation[];
  opacity?: number;
  showContours?: boolean;
  visible?: boolean;
}

// ---------------------------------------------------------------------------
// Color mapping
// ---------------------------------------------------------------------------

/** Map temperature (F) to RGBA color */
const tempToColor = (temp: number): [number, number, number] => {
  // Gradient stops: <0F deep blue, 32F cyan, 50F green, 65F yellow, 80F orange, 100F+ deep red
  if (temp <= 0) return [30, 58, 95];
  if (temp <= 10) return lerp3([30, 58, 95], [37, 99, 235], (temp - 0) / 10);
  if (temp <= 20) return lerp3([37, 99, 235], [6, 182, 212], (temp - 10) / 10);
  if (temp <= 32) return lerp3([6, 182, 212], [16, 185, 129], (temp - 20) / 12);
  if (temp <= 50) return lerp3([16, 185, 129], [132, 204, 22], (temp - 32) / 18);
  if (temp <= 65) return lerp3([132, 204, 22], [234, 179, 8], (temp - 50) / 15);
  if (temp <= 80) return lerp3([234, 179, 8], [249, 115, 22], (temp - 65) / 15);
  if (temp <= 90) return lerp3([249, 115, 22], [239, 68, 68], (temp - 80) / 10);
  if (temp <= 100) return lerp3([239, 68, 68], [153, 27, 27], (temp - 90) / 10);
  return [153, 27, 27];
};

const lerp3 = (
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] => {
  const tc = Math.max(0, Math.min(1, t));
  return [
    Math.round(a[0] + (b[0] - a[0]) * tc),
    Math.round(a[1] + (b[1] - a[1]) * tc),
    Math.round(a[2] + (b[2] - a[2]) * tc),
  ];
};

// ---------------------------------------------------------------------------
// Gaussian interpolation
// ---------------------------------------------------------------------------

/** Compute temperature at pixel (px, py) via Gaussian-weighted IDW */
const interpolateTemp = (
  px: number,
  py: number,
  stations: { x: number; y: number; temp: number }[],
  sigma: number,
): number => {
  let sumTemp = 0;
  let sumWeight = 0;

  for (const s of stations) {
    const dx = px - s.x;
    const dy = py - s.y;
    const distSq = dx * dx + dy * dy;
    const weight = Math.exp(-distSq / (2 * sigma * sigma));
    sumTemp += s.temp * weight;
    sumWeight += weight;
  }

  return sumWeight > 0 ? sumTemp / sumWeight : 60; // Default to 60F
};

// ---------------------------------------------------------------------------
// Contour line drawing
// ---------------------------------------------------------------------------

const drawContours = (
  ctx: CanvasRenderingContext2D,
  grid: Float32Array,
  gridW: number,
  gridH: number,
  stepX: number,
  stepY: number,
  interval: number,
  minTemp: number,
  maxTemp: number,
) => {
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  ctx.font = '9px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.45)';

  // Simple marching squares for each contour level
  for (let level = Math.ceil(minTemp / interval) * interval; level <= maxTemp; level += interval) {
    ctx.beginPath();
    let labelPlaced = false;

    for (let gy = 0; gy < gridH - 1; gy++) {
      for (let gx = 0; gx < gridW - 1; gx++) {
        const tl = grid[gy * gridW + gx];
        const tr = grid[gy * gridW + gx + 1];
        const bl = grid[(gy + 1) * gridW + gx];
        const br = grid[(gy + 1) * gridW + gx + 1];

        // Marching squares case index
        const idx =
          (tl >= level ? 8 : 0) |
          (tr >= level ? 4 : 0) |
          (br >= level ? 2 : 0) |
          (bl >= level ? 1 : 0);

        if (idx === 0 || idx === 15) continue;

        const x0 = gx * stepX;
        const y0 = gy * stepY;
        const x1 = (gx + 1) * stepX;
        const y1 = (gy + 1) * stepY;

        // Interpolation helpers
        const lerpX = (v1: number, v2: number) =>
          v1 === v2 ? 0.5 : (level - v1) / (v2 - v1);

        const top = x0 + lerpX(tl, tr) * stepX;
        const bottom = x0 + lerpX(bl, br) * stepX;
        const left = y0 + lerpX(tl, bl) * stepY;
        const right = y0 + lerpX(tr, br) * stepY;

        // Draw segments based on case
        const segments: [number, number, number, number][] = [];
        switch (idx) {
        case 1: case 14: segments.push([x0, left, bottom, y1]); break;
        case 2: case 13: segments.push([bottom, y1, x1, right]); break;
        case 3: case 12: segments.push([x0, left, x1, right]); break;
        case 4: case 11: segments.push([top, y0, x1, right]); break;
        case 5: segments.push([x0, left, top, y0], [bottom, y1, x1, right]); break;
        case 6: case 9: segments.push([top, y0, bottom, y1]); break;
        case 7: case 8: segments.push([x0, left, top, y0]); break;
        case 10: segments.push([top, y0, x1, right], [x0, left, bottom, y1]); break;
        }

        for (const [sx, sy, ex, ey] of segments) {
          ctx.moveTo(sx, sy);
          ctx.lineTo(ex, ey);

          // Place label once per contour level
          if (!labelPlaced && gx > gridW * 0.2 && gx < gridW * 0.8) {
            const lx = (sx + ex) / 2;
            const ly = (sy + ey) / 2;
            ctx.stroke();
            ctx.beginPath();
            ctx.fillText(`${level}\u00B0`, lx + 2, ly - 2);
            labelPlaced = true;
          }
        }
      }
    }
    ctx.stroke();
  }
};

// ---------------------------------------------------------------------------
// TemperatureOverlay component
// ---------------------------------------------------------------------------

const TemperatureOverlay: React.FC<TemperatureOverlayProps> = ({
  stations,
  opacity = 0.5,
  showContours = true,
  visible = true,
}) => {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Render the heatmap
  const render = useCallback(
    (mapInst: LeafletMap) => {
      const canvas = canvasRef.current;
      if (!canvas || !visible || stations.length === 0) return;

      const container = mapInst.getContainer();
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width;
      const height = rect.height;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Project stations to pixel
      const projStations = stations.map((s) => {
        const pt = mapInst.latLngToContainerPoint([s.lat, s.lng]);
        return { x: pt.x, y: pt.y, temp: s.temperature };
      });

      // Compute grid at lower resolution for performance
      const step = 8;
      const gridW = Math.ceil(width / step) + 1;
      const gridH = Math.ceil(height / step) + 1;
      const grid = new Float32Array(gridW * gridH);

      // Sigma scales with zoom: wider at lower zoom
      const zoom = mapInst.getZoom();
      const sigma = Math.max(50, 300 / Math.pow(1.5, zoom - 4));

      let minTemp = Infinity;
      let maxTemp = -Infinity;

      for (let gy = 0; gy < gridH; gy++) {
        for (let gx = 0; gx < gridW; gx++) {
          const px = gx * step;
          const py = gy * step;
          const temp = interpolateTemp(px, py, projStations, sigma);
          grid[gy * gridW + gx] = temp;
          if (temp < minTemp) minTemp = temp;
          if (temp > maxTemp) maxTemp = temp;
        }
      }

      // Draw heatmap pixels
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          // Bilinear interpolation from grid
          const gx = x / step;
          const gy = y / step;
          const gx0 = Math.floor(gx);
          const gy0 = Math.floor(gy);
          const gx1 = Math.min(gx0 + 1, gridW - 1);
          const gy1 = Math.min(gy0 + 1, gridH - 1);
          const fx = gx - gx0;
          const fy = gy - gy0;

          const t00 = grid[gy0 * gridW + gx0];
          const t10 = grid[gy0 * gridW + gx1];
          const t01 = grid[gy1 * gridW + gx0];
          const t11 = grid[gy1 * gridW + gx1];

          const temp =
            t00 * (1 - fx) * (1 - fy) +
            t10 * fx * (1 - fy) +
            t01 * (1 - fx) * fy +
            t11 * fx * fy;

          const [r, g, b] = tempToColor(temp);
          const idx = (y * width + x) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 160; // Alpha channel (will be combined with CSS opacity)
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Draw contour lines
      if (showContours) {
        drawContours(ctx, grid, gridW, gridH, step, step, 5, minTemp, maxTemp);
      }

      // Draw station dots
      for (const s of projStations) {
        if (s.x >= -10 && s.x <= width + 10 && s.y >= -10 && s.y <= height + 10) {
          const [r, g, b] = tempToColor(s.temp);
          ctx.beginPath();
          ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.6)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
    },
    [stations, visible, showContours],
  );

  // Debounced render
  const scheduleRender = useCallback(() => {
    if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
    renderTimeoutRef.current = setTimeout(() => render(map), 50);
  }, [map, render]);

  // Setup canvas element
  useEffect(() => {
    if (!visible) {
      if (canvasRef.current) canvasRef.current.style.display = 'none';
      return;
    }

    const container = map.getContainer();
    let canvas = canvasRef.current;

    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '440';
      container.appendChild(canvas);
      canvasRef.current = canvas;
    }

    canvas.style.display = 'block';
    canvas.style.opacity = String(opacity);

    render(map);

    map.on('moveend', scheduleRender);
    map.on('zoomend', scheduleRender);

    return () => {
      map.off('moveend', scheduleRender);
      map.off('zoomend', scheduleRender);
      if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
    };
  }, [map, visible, opacity, render, scheduleRender]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (canvasRef.current && canvasRef.current.parentNode) {
        canvasRef.current.parentNode.removeChild(canvasRef.current);
        canvasRef.current = null;
      }
      if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
    };
  }, []);

  return null; // Renders via imperative canvas
};

export default TemperatureOverlay;
