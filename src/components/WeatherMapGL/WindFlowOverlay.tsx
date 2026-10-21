import React, { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- @types/leaflet may not be installed
import type { Map as LeafletMap } from 'leaflet';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WindStation {
  lat: number;
  lng: number;
  windSpeed: number;
  windDirection: number; // meteorological degrees (0=N, 90=E, 180=S, 270=W)
}

interface WindFlowOverlayProps {
  stations: WindStation[];
  opacity?: number;
  particleCount?: number;
  showBarbs?: boolean;
  visible?: boolean;
}

// ---------------------------------------------------------------------------
// Particle system
// ---------------------------------------------------------------------------

interface Particle {
  x: number;
  y: number;
  age: number;
  maxAge: number;
  vx: number;
  vy: number;
  speed: number;
}

const MAX_SPEED = 50; // mph cap for normalization

/** Convert meteorological wind direction (where wind comes FROM) to math radians */
const windToRadians = (deg: number): number => {
  // Meteorological: 0=N (from N, blowing south). Math: 0=right (east)
  // Wind blows FROM `deg`, so direction of motion = deg + 180
  const motionDeg = (deg + 180) % 360;
  return ((270 - motionDeg) * Math.PI) / 180;
};

/** Bilinear interpolation of wind field at a point */
const interpolateWind = (
  x: number,
  y: number,
  stations: { px: number; py: number; vx: number; vy: number; speed: number }[],
): { vx: number; vy: number; speed: number } => {
  let sumVx = 0;
  let sumVy = 0;
  let sumSpeed = 0;
  let sumWeight = 0;

  for (const s of stations) {
    const dx = x - s.px;
    const dy = y - s.py;
    const distSq = dx * dx + dy * dy;
    const weight = 1 / (distSq + 1000); // Inverse distance weighting with smoothing
    sumVx += s.vx * weight;
    sumVy += s.vy * weight;
    sumSpeed += s.speed * weight;
    sumWeight += weight;
  }

  if (sumWeight === 0) return { vx: 0, vy: 0, speed: 0 };
  return {
    vx: sumVx / sumWeight,
    vy: sumVy / sumWeight,
    speed: sumSpeed / sumWeight,
  };
};

/** Color for a given wind speed */
const speedColor = (speed: number, alpha: number): string => {
  const t = Math.min(speed / MAX_SPEED, 1);
  if (t < 0.25) {
    const r = 96, g = 165, b = 250;
    return `rgba(${r},${g},${b},${alpha * (0.3 + t * 2)})`;
  } else if (t < 0.5) {
    const r = 59, g = 130, b = 246;
    return `rgba(${r},${g},${b},${alpha * (0.5 + t)})`;
  } else if (t < 0.75) {
    const r = Math.round(59 + (234 - 59) * ((t - 0.5) / 0.25));
    const g = Math.round(130 + (179 - 130) * ((t - 0.5) / 0.25));
    const b = Math.round(246 + (8 - 246) * ((t - 0.5) / 0.25));
    return `rgba(${r},${g},${b},${alpha * 0.85})`;
  } else {
    const r = Math.round(234 + (239 - 234) * ((t - 0.75) / 0.25));
    const g = Math.round(179 + (68 - 179) * ((t - 0.75) / 0.25));
    const b = Math.round(8 + (68 - 8) * ((t - 0.75) / 0.25));
    return `rgba(${r},${g},${b},${alpha * 0.95})`;
  }
};

// ---------------------------------------------------------------------------
// Wind barb drawing
// ---------------------------------------------------------------------------

const drawWindBarb = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  speed: number,
  direction: number,
): void => {
  const radians = windToRadians(direction);
  const length = 24;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-radians + Math.PI / 2);

  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';

  // Shaft
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -length);
  ctx.stroke();

  // Barbs (every 10 knots = ~11.5 mph)
  let remaining = speed;
  let barbY = -length;
  const barbSpacing = 5;

  // Pennants (50 knots)
  while (remaining >= 57.5) {
    ctx.beginPath();
    ctx.moveTo(0, barbY);
    ctx.lineTo(10, barbY + 2);
    ctx.lineTo(0, barbY + 5);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();
    barbY += barbSpacing + 2;
    remaining -= 57.5;
  }

  // Full barbs (10 knots ~ 11.5 mph)
  while (remaining >= 8) {
    ctx.beginPath();
    ctx.moveTo(0, barbY);
    ctx.lineTo(10, barbY - 3);
    ctx.stroke();
    barbY += barbSpacing;
    remaining -= 11.5;
  }

  // Half barb (5 knots ~ 5.75 mph)
  if (remaining >= 3) {
    ctx.beginPath();
    ctx.moveTo(0, barbY);
    ctx.lineTo(5, barbY - 2);
    ctx.stroke();
  }

  // Circle at base
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fillStyle = speedColor(speed, 0.9);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
};

// ---------------------------------------------------------------------------
// WindFlowOverlay component
// ---------------------------------------------------------------------------

const WindFlowOverlay: React.FC<WindFlowOverlayProps> = ({
  stations,
  opacity = 0.7,
  particleCount = 2000,
  showBarbs = false,
  visible = true,
}) => {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const stationsPixelRef = useRef<
    { px: number; py: number; vx: number; vy: number; speed: number; lat: number; lng: number; dir: number }[]
  >([]);

  // Project stations to pixel coordinates
  const projectStations = useCallback(
    (mapInst: LeafletMap) => {
      stationsPixelRef.current = stations.map((s) => {
        const pt = mapInst.latLngToContainerPoint([s.lat, s.lng]);
        const rad = windToRadians(s.windDirection);
        const norm = s.windSpeed / MAX_SPEED;
        return {
          px: pt.x,
          py: pt.y,
          vx: Math.cos(rad) * norm * 2.5,
          vy: -Math.sin(rad) * norm * 2.5, // Canvas y is inverted
          speed: s.windSpeed,
          lat: s.lat,
          lng: s.lng,
          dir: s.windDirection,
        };
      });
    },
    [stations],
  );

  // Initialize / reset particles
  const initParticles = useCallback(
    (width: number, height: number) => {
      const particles: Particle[] = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          age: Math.floor(Math.random() * 100),
          maxAge: 80 + Math.floor(Math.random() * 70),
          vx: 0,
          vy: 0,
          speed: 0,
        });
      }
      particlesRef.current = particles;
    },
    [particleCount],
  );

  // Setup canvas
  useEffect(() => {
    if (!visible) return;

    const container = map.getContainer();
    let canvas = canvasRef.current;

    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '450';
      container.appendChild(canvas);
      canvasRef.current = canvas;
    }

    const resize = () => {
      if (!canvas) return;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
      initParticles(rect.width, rect.height);
    };

    resize();

    const onMoveOrZoom = () => {
      projectStations(map);
      resize();
    };

    map.on('moveend', onMoveOrZoom);
    map.on('zoomend', onMoveOrZoom);
    window.addEventListener('resize', resize);

    projectStations(map);

    return () => {
      map.off('moveend', onMoveOrZoom);
      map.off('zoomend', onMoveOrZoom);
      window.removeEventListener('resize', resize);
    };
  }, [map, visible, initParticles, projectStations]);

  // Animation loop
  useEffect(() => {
    if (!visible) {
      if (canvasRef.current) canvasRef.current.style.display = 'none';
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.style.display = 'block';
    canvas.style.opacity = String(opacity);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = map.getContainer();
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const animate = () => {
      // Fade previous frame
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = 'rgba(0,0,0,0.92)';
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      const stationsPx = stationsPixelRef.current;
      const particles = particlesRef.current;

      for (const p of particles) {
        // Interpolate wind at particle position
        const wind = interpolateWind(p.x, p.y, stationsPx);
        p.vx = wind.vx;
        p.vy = wind.vy;
        p.speed = wind.speed;

        // Move particle
        p.x += p.vx;
        p.y += p.vy;
        p.age++;

        // Reset if out of bounds or too old
        if (p.age >= p.maxAge || p.x < -10 || p.x > width + 10 || p.y < -10 || p.y > height + 10) {
          p.x = Math.random() * width;
          p.y = Math.random() * height;
          p.age = 0;
          p.maxAge = 80 + Math.floor(Math.random() * 70);
          continue;
        }

        // Draw particle
        const fadeFactor = p.age < 10 ? p.age / 10 : p.age > p.maxAge - 10 ? (p.maxAge - p.age) / 10 : 1;
        const alpha = fadeFactor * 0.6;
        const radius = 0.8 + (p.speed / MAX_SPEED) * 0.8;

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = speedColor(p.speed, alpha);
        ctx.fill();
      }

      // Draw wind barbs at station locations
      if (showBarbs) {
        ctx.globalCompositeOperation = 'source-over';
        for (const s of stationsPx) {
          // Only draw barbs if station is on screen
          if (s.px >= -20 && s.px <= width + 20 && s.py >= -20 && s.py <= height + 20) {
            drawWindBarb(ctx, s.px, s.py, s.speed, s.dir);
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [map, visible, opacity, showBarbs]);

  // Cleanup canvas on unmount
  useEffect(() => {
    return () => {
      if (canvasRef.current && canvasRef.current.parentNode) {
        canvasRef.current.parentNode.removeChild(canvasRef.current);
        canvasRef.current = null;
      }
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return null; // Renders via imperative canvas
};

export default WindFlowOverlay;
