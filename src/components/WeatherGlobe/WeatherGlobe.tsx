// WeatherGlobe - Canvas/WebGL-powered 3D globe with animated weather overlays
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { colors, spacing } from '../ui/tokens';
import { apiClient } from '../../services/apiClient';
import FEATURES from '../../config/features';
import GlobeLayerControls from './GlobeLayerControls';
import GlobeTimeScrubber from './GlobeTimeScrubber';
import GlobeStationDetail from './GlobeStationDetail';

// ---------- Types ----------

export interface StationData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  elevation: number;
  status: 'active' | 'degraded' | 'offline';
  qualityScore: number;
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  earningsToday: number;
  earnings7d: number;
  earningsMonthly: number;
  lastSeen: string;
  sparkline: number[];
}

export interface LayerState {
  stations: boolean;
  windFlow: boolean;
  temperatureHeatmap: boolean;
  coverageZones: boolean;
  networkConnections: boolean;
  precipitation: boolean;
}

interface ProjectedPoint {
  x: number;
  y: number;
  visible: boolean;
  depth: number;
}

interface WindParticle {
  lat: number;
  lng: number;
  age: number;
  maxAge: number;
  speed: number;
  dirLat: number;
  dirLng: number;
}

interface PrecipParticle {
  lat: number;
  lng: number;
  type: 'rain' | 'snow' | 'sleet';
  age: number;
  maxAge: number;
  offsetY: number;
  size: number;
}

interface StationCluster {
  stations: (StationData & ProjectedPoint)[];
  cx: number;
  cy: number;
  count: number;
}

// ---------- Constants ----------

const GLOBE_SIZE = 600;
const GLOBE_CENTER = GLOBE_SIZE / 2;
const GLOBE_RADIUS = 240;
const WIND_PARTICLE_COUNT = 300;
const PRECIP_PARTICLE_COUNT = 120;
const CLUSTER_DISTANCE = 30;

// ---------- Mock Data ----------

// stations removed — fetched from API

// Continent outlines for SVG rendering
const CONTINENTS: { name: string; points: [number, number][] }[] = [
  { name: 'North America', points: [[60,-140],[65,-170],[70,-160],[72,-130],[70,-100],[65,-90],[60,-80],[50,-65],[45,-65],[42,-70],[35,-75],[30,-82],[25,-80],[20,-87],[15,-88],[15,-92],[18,-105],[22,-105],[30,-115],[35,-120],[40,-125],[48,-125],[55,-130],[60,-140]] },
  { name: 'South America', points: [[12,-70],[10,-62],[8,-60],[5,-52],[0,-50],[-5,-35],[-10,-37],[-15,-40],[-20,-42],[-25,-48],[-30,-50],[-35,-57],[-40,-62],[-45,-65],[-50,-68],[-55,-68],[-55,-70],[-50,-75],[-45,-75],[-40,-72],[-30,-72],[-20,-70],[-10,-76],[-5,-80],[0,-78],[5,-77],[10,-72],[12,-70]] },
  { name: 'Europe', points: [[36,-10],[38,-5],[43,-8],[44,0],[48,-5],[50,2],[52,5],[55,8],[57,10],[60,5],[62,10],[65,15],[68,20],[70,28],[68,35],[65,40],[60,40],[55,38],[52,35],[48,30],[45,28],[42,28],[40,25],[38,22],[36,22],[35,15],[37,10],[36,-10]] },
  { name: 'Africa', points: [[35,-10],[37,10],[35,15],[33,12],[30,32],[25,35],[20,38],[15,42],[10,45],[5,42],[0,42],[-5,40],[-10,40],[-15,35],[-20,35],[-25,33],[-30,30],[-35,20],[-35,18],[-30,18],[-25,15],[-20,12],[-15,12],[-10,14],[-5,10],[0,10],[5,0],[5,-5],[10,-15],[15,-17],[20,-17],[25,-15],[30,-10],[35,-10]] },
  { name: 'Asia', points: [[70,28],[72,50],[72,70],[70,90],[68,110],[70,130],[68,140],[65,160],[60,165],[55,160],[50,140],[45,135],[40,130],[35,130],[35,120],[30,120],[25,105],[22,100],[20,100],[15,100],[10,105],[5,100],[0,103],[-5,105],[-8,110],[-5,115],[-8,120],[-5,130],[0,130],[5,120],[10,118],[15,110],[20,107],[22,90],[25,80],[20,72],[22,68],[25,65],[25,60],[30,50],[35,45],[38,42],[40,42],[42,45],[45,50],[50,55],[55,60],[60,60],[65,55],[68,45],[70,28]] },
  { name: 'Australia', points: [[-12,130],[-15,125],[-20,118],[-25,114],[-30,115],[-35,118],[-37,140],[-38,145],[-37,150],[-33,152],[-28,153],[-23,150],[-18,146],[-15,145],[-12,142],[-10,135],[-12,130]] },
];

// Temperature grid for heatmap interpolation
const TEMP_GRID: { lat: number; lng: number; temp: number }[] = [
  { lat: 0, lng: 25, temp: 35 }, { lat: 10, lng: -10, temp: 32 }, { lat: -5, lng: 35, temp: 30 },
  { lat: 25, lng: 55, temp: 28 }, { lat: 30, lng: 80, temp: 20 }, { lat: -25, lng: 130, temp: 26 },
  { lat: 55, lng: 10, temp: 2 }, { lat: 60, lng: 30, temp: -5 }, { lat: 65, lng: -20, temp: -8 },
  { lat: -35, lng: -60, temp: 18 }, { lat: 40, lng: -100, temp: 10 }, { lat: 35, lng: 130, temp: 8 },
  { lat: 70, lng: 140, temp: -20 }, { lat: -10, lng: 100, temp: 29 }, { lat: 20, lng: -90, temp: 22 },
  { lat: -60, lng: 0, temp: -15 }, { lat: -60, lng: 90, temp: -18 }, { lat: -60, lng: -90, temp: -12 },
  { lat: 70, lng: -100, temp: -25 }, { lat: 70, lng: 60, temp: -15 }, { lat: 0, lng: -60, temp: 27 },
  { lat: 0, lng: 140, temp: 28 }, { lat: -20, lng: -50, temp: 25 }, { lat: 45, lng: -70, temp: 5 },
];

// Precipitation zone definitions
const PRECIP_ZONES: { lat: number; lng: number; type: 'rain' | 'snow' | 'sleet'; radius: number; intensity: number }[] = [
  { lat: 52, lng: 0, type: 'rain', radius: 8, intensity: 0.7 },
  { lat: 54, lng: 5, type: 'rain', radius: 6, intensity: 0.5 },
  { lat: 50, lng: -3, type: 'rain', radius: 5, intensity: 0.6 },
  { lat: 35, lng: 135, type: 'rain', radius: 7, intensity: 0.8 },
  { lat: 37, lng: 138, type: 'rain', radius: 5, intensity: 0.5 },
  { lat: -23, lng: -43, type: 'rain', radius: 8, intensity: 0.9 },
  { lat: 60, lng: 25, type: 'snow', radius: 10, intensity: 0.7 },
  { lat: 62, lng: 30, type: 'snow', radius: 6, intensity: 0.6 },
  { lat: 65, lng: -20, type: 'snow', radius: 12, intensity: 0.8 },
  { lat: 55, lng: 37, type: 'snow', radius: 7, intensity: 0.5 },
  { lat: 63, lng: -18, type: 'snow', radius: 5, intensity: 0.4 },
  { lat: 70, lng: 100, type: 'snow', radius: 9, intensity: 0.6 },
  { lat: 48, lng: -2, type: 'sleet', radius: 4, intensity: 0.4 },
  { lat: 56, lng: 12, type: 'sleet', radius: 5, intensity: 0.5 },
];

// ---------- Helpers ----------

const projectToGlobe = (lat: number, lng: number, rotationOffset: number): ProjectedPoint => {
  const adjustedLng = ((lng + rotationOffset + 180) % 360) - 180;
  const radLat = (lat * Math.PI) / 180;
  const radLng = (adjustedLng * Math.PI) / 180;
  const cosLat = Math.cos(radLat);
  const cosLng = Math.cos(radLng);
  const sinLng = Math.sin(radLng);
  const sinLat = Math.sin(radLat);

  const x = GLOBE_CENTER + GLOBE_RADIUS * cosLat * sinLng;
  const y = GLOBE_CENTER - GLOBE_RADIUS * sinLat;
  const depth = cosLat * cosLng;

  return { x, y, visible: depth > 0, depth };
};

const tempToRGBA = (temp: number, alpha: number): [number, number, number, number] => {
  const clamped = Math.max(-25, Math.min(45, temp));
  const t = (clamped + 25) / 70;
  let r: number, g: number, b: number;

  if (t < 0.2) {
    const f = t / 0.2;
    r = 20 + 30 * f; g = 50 + 80 * f; b = 180 + 75 * f;
  } else if (t < 0.4) {
    const f = (t - 0.2) / 0.2;
    r = 50 + 80 * f; g = 130 + 100 * f; b = 255 - 60 * f;
  } else if (t < 0.6) {
    const f = (t - 0.4) / 0.2;
    r = 130 + 80 * f; g = 230 + 20 * f; b = 195 - 130 * f;
  } else if (t < 0.8) {
    const f = (t - 0.6) / 0.2;
    r = 210 + 35 * f; g = 250 - 100 * f; b = 65 - 40 * f;
  } else {
    const f = (t - 0.8) / 0.2;
    r = 245 + 10 * f; g = 150 - 100 * f; b = 25 - 20 * f;
  }

  return [Math.round(r), Math.round(g), Math.round(b), Math.round(alpha * 255)];
};

const tempToCSS = (temp: number): string => {
  const [r, g, b] = tempToRGBA(temp, 1);
  return `rgb(${r},${g},${b})`;
};

const idwInterpolate = (lat: number, lng: number, points: typeof TEMP_GRID, power: number = 2): number => {
  let numerator = 0;
  let denominator = 0;
  for (const p of points) {
    const dLat = lat - p.lat;
    const dLng = lng - p.lng;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    if (dist < 0.5) return p.temp;
    const w = 1 / Math.pow(dist, power);
    numerator += w * p.temp;
    denominator += w;
  }
  return denominator > 0 ? numerator / denominator : 15;
};

const stationColor = (status: string): string => {
  if (status === 'active') return colors.success.main;
  if (status === 'degraded') return colors.warning.main;
  return colors.error.main;
};

const precipColor = (type: 'rain' | 'snow' | 'sleet'): string => {
  if (type === 'rain') return '#60A5FA';
  if (type === 'snow') return '#F0F4FF';
  return '#FCD34D';
};

// ---------- Canvas Rendering Hooks ----------

const useWindParticles = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  rotation: number,
  enabled: boolean,
  opacity: number,
) => {
  const particlesRef = useRef<WindParticle[]>([]);
  const animFrameRef = useRef<number>(0);

  const initParticle = useCallback((): WindParticle => {
    const lat = (Math.random() - 0.5) * 140;
    const lng = (Math.random() - 0.5) * 360;
    const dirRad = Math.random() * Math.PI * 2;
    return {
      lat, lng,
      age: Math.random() * 80,
      maxAge: 60 + Math.random() * 60,
      speed: 0.3 + Math.random() * 0.8,
      dirLat: Math.sin(dirRad) * 0.4,
      dirLng: Math.cos(dirRad) * 0.8,
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      particlesRef.current = [];
      return;
    }
    if (particlesRef.current.length === 0) {
      particlesRef.current = Array.from({ length: WIND_PARTICLE_COUNT }, initParticle);
    }
  }, [enabled, initParticle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, GLOBE_SIZE, GLOBE_SIZE);

      // Clip to globe circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(GLOBE_CENTER, GLOBE_CENTER, GLOBE_RADIUS, 0, Math.PI * 2);
      ctx.clip();

      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.lat += p.dirLat * p.speed;
        p.lng += p.dirLng * p.speed;
        p.age += 1;

        if (p.age > p.maxAge || Math.abs(p.lat) > 80) {
          particles[i] = initParticle();
          continue;
        }

        const proj = projectToGlobe(p.lat, p.lng, rotation);
        if (!proj.visible) continue;

        const lifeFraction = p.age / p.maxAge;
        const fadeIn = Math.min(lifeFraction * 5, 1);
        const fadeOut = Math.max(1 - (lifeFraction - 0.7) / 0.3, 0);
        const alpha = fadeIn * (lifeFraction > 0.7 ? fadeOut : 1) * opacity * proj.depth;

        // Draw wind streak
        const prevProj = projectToGlobe(
          p.lat - p.dirLat * p.speed * 3,
          p.lng - p.dirLng * p.speed * 3,
          rotation,
        );

        if (prevProj.visible) {
          ctx.beginPath();
          ctx.moveTo(prevProj.x, prevProj.y);
          ctx.lineTo(proj.x, proj.y);
          ctx.strokeStyle = `rgba(180, 210, 255, ${alpha * 0.6})`;
          ctx.lineWidth = 1 + p.speed * 0.5;
          ctx.stroke();
        }

        // Particle head
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 1 + p.speed * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 225, 255, ${alpha * 0.8})`;
        ctx.fill();
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [canvasRef, rotation, enabled, opacity, initParticle]);
};

const usePrecipRenderer = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  rotation: number,
  enabled: boolean,
  opacity: number,
) => {
  const particlesRef = useRef<PrecipParticle[]>([]);
  const animFrameRef = useRef<number>(0);

  const initPrecipParticle = useCallback((): PrecipParticle => {
    const zone = PRECIP_ZONES[Math.floor(Math.random() * PRECIP_ZONES.length)];
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * zone.radius;
    return {
      lat: zone.lat + Math.cos(angle) * dist,
      lng: zone.lng + Math.sin(angle) * dist,
      type: zone.type,
      age: Math.random() * 40,
      maxAge: 30 + Math.random() * 30,
      offsetY: 0,
      size: zone.type === 'snow' ? 1.5 + Math.random() * 1.5 : 1 + Math.random(),
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      particlesRef.current = [];
      return;
    }
    if (particlesRef.current.length === 0) {
      particlesRef.current = Array.from({ length: PRECIP_PARTICLE_COUNT }, initPrecipParticle);
    }
  }, [enabled, initPrecipParticle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, GLOBE_SIZE, GLOBE_SIZE);

      ctx.save();
      ctx.beginPath();
      ctx.arc(GLOBE_CENTER, GLOBE_CENTER, GLOBE_RADIUS, 0, Math.PI * 2);
      ctx.clip();

      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.age += 1;

        if (p.type === 'rain') {
          p.offsetY += 1.5;
        } else if (p.type === 'snow') {
          p.offsetY += 0.4;
          p.lng += Math.sin(p.age * 0.1) * 0.05;
        } else {
          p.offsetY += 1.0;
          p.lng += Math.sin(p.age * 0.15) * 0.03;
        }

        if (p.age > p.maxAge) {
          particles[i] = initPrecipParticle();
          continue;
        }

        const proj = projectToGlobe(p.lat, p.lng, rotation);
        if (!proj.visible) continue;

        const alpha = opacity * proj.depth * 0.8;
        const drawY = proj.y + p.offsetY;

        if (drawY > GLOBE_CENTER + GLOBE_RADIUS) {
          particles[i] = initPrecipParticle();
          continue;
        }

        const color = precipColor(p.type);

        if (p.type === 'rain') {
          ctx.beginPath();
          ctx.moveTo(proj.x, drawY - 3);
          ctx.lineTo(proj.x, drawY + 3);
          ctx.strokeStyle = color;
          ctx.globalAlpha = alpha;
          ctx.lineWidth = p.size;
          ctx.stroke();
          ctx.globalAlpha = 1;
        } else if (p.type === 'snow') {
          ctx.beginPath();
          ctx.arc(proj.x, drawY, p.size, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.globalAlpha = alpha * 0.9;
          ctx.fill();
          ctx.globalAlpha = 1;
        } else {
          // Sleet - small diagonal dash
          ctx.beginPath();
          ctx.moveTo(proj.x - 1, drawY - 2);
          ctx.lineTo(proj.x + 1, drawY + 2);
          ctx.strokeStyle = color;
          ctx.globalAlpha = alpha;
          ctx.lineWidth = p.size;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [canvasRef, rotation, enabled, opacity, initPrecipParticle]);
};

// ---------- Component ----------

const WeatherGlobe: React.FC = () => {
  const [stations, setStations] = useState<StationData[]>([]);
  const [rotation, setRotation] = useState(0);
  const [selectedStation, setSelectedStation] = useState<StationData | null>(null);
  const [hoveredStation, setHoveredStation] = useState<string | null>(null);
  const [layers, setLayers] = useState<LayerState>({
    stations: true,
    windFlow: true,
    temperatureHeatmap: false,
    coverageZones: false,
    networkConnections: false,
    precipitation: false,
  });
  const [overlayOpacity, setOverlayOpacity] = useState(70);
  const [currentHour, setCurrentHour] = useState(14);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; rot: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const windCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const precipCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const opacityFraction = overlayOpacity / 100;

  // Wind particle animation
  // frontend#328: the wind-flow particles and PRECIP_ZONES are invented
  // (random particles, hard-coded zones) — the stations are real. The two
  // synthetic layers only render under demo surfaces; their counts read 0 and
  // their toggles are inert otherwise.
  const syntheticLayersAllowed = FEATURES.demoSurfaces;
  useWindParticles(windCanvasRef, rotation, layers.windFlow && syntheticLayersAllowed, opacityFraction);

  // Precipitation particle animation
  usePrecipRenderer(precipCanvasRef, rotation, layers.precipitation && syntheticLayersAllowed, opacityFraction);

  // Fetch stations from API
  useEffect(() => {
    apiClient.get<StationData[]>('/weather/globe/stations')
      .then((data) => { if (data) setStations(data); })
      .catch(() => {});
  }, []);

  // Auto-rotation (pauses during drag)
  useEffect(() => {
    if (isDragging) return;
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 0.15) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, [isDragging]);

  // Layer toggle
  const handleLayerToggle = useCallback((layer: keyof LayerState) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  // Reset view
  const handleResetView = useCallback(() => {
    setRotation(0);
    setZoomLevel(1);
    setLayers({
      stations: true,
      windFlow: true,
      temperatureHeatmap: false,
      coverageZones: false,
      networkConnections: false,
      precipitation: false,
    });
    setOverlayOpacity(70);
    setSelectedStation(null);
  }, []);

  // Globe drag rotation
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, rot: rotation });
  }, [rotation]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return;
    const dx = e.clientX - dragStart.x;
    setRotation((dragStart.rot + dx * 0.3) % 360);
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

  // Zoom with mouse wheel
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoomLevel((prev) => Math.max(0.5, Math.min(3, prev - e.deltaY * 0.001)));
  }, []);

  // Layer counts
  const layerCounts = useMemo(() => ({
    stations: stations.length,
    windFlow: syntheticLayersAllowed ? WIND_PARTICLE_COUNT : 0,
    temperatureHeatmap: TEMP_GRID.length,
    coverageZones: 5,
    networkConnections: 12,
    precipitation: syntheticLayersAllowed ? PRECIP_ZONES.length : 0,
  }), [stations, syntheticLayersAllowed]);

  // Project continents
  const continentPaths = useMemo(() => {
    return CONTINENTS.map((continent) => {
      const projected = continent.points.map(([lat, lng]) => projectToGlobe(lat, lng, rotation));
      const visibleCount = projected.filter((p) => p.visible).length;
      if (visibleCount < projected.length * 0.3) return null;
      const pathData = projected
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(' ') + ' Z';
      return { name: continent.name, path: pathData };
    });
  }, [rotation]);

  // Project stations with clustering
  const projectedStations = useMemo(() => {
    return stations.map((station) => {
      const pos = projectToGlobe(station.lat, station.lng, rotation);
      return { ...station, ...pos };
    });
  }, [stations, rotation]);

  // Cluster stations when zoomed out
  const stationClusters = useMemo((): StationCluster[] => {
    const visible = projectedStations.filter((s) => s.visible);
    if (zoomLevel > 1.5) {
      // No clustering at high zoom
      return visible.map((s) => ({ stations: [s], cx: s.x, cy: s.y, count: 1 }));
    }

    const clusterDist = CLUSTER_DISTANCE / zoomLevel;
    const used = new Set<number>();
    const clusters: StationCluster[] = [];

    for (let i = 0; i < visible.length; i++) {
      if (used.has(i)) continue;
      const cluster: (StationData & ProjectedPoint)[] = [visible[i]];
      used.add(i);

      for (let j = i + 1; j < visible.length; j++) {
        if (used.has(j)) continue;
        const dx = visible[i].x - visible[j].x;
        const dy = visible[i].y - visible[j].y;
        if (Math.sqrt(dx * dx + dy * dy) < clusterDist) {
          cluster.push(visible[j]);
          used.add(j);
        }
      }

      const cx = cluster.reduce((s, c) => s + c.x, 0) / cluster.length;
      const cy = cluster.reduce((s, c) => s + c.y, 0) / cluster.length;
      clusters.push({ stations: cluster, cx, cy, count: cluster.length });
    }
    return clusters;
  }, [projectedStations, zoomLevel]);

  // Temperature heatmap points (rendered as radial gradients on SVG)
  const heatmapCircles = useMemo(() => {
    if (!layers.temperatureHeatmap) return [];
    // Sample a grid of points and interpolate temperatures
    const points: { x: number; y: number; color: string; depth: number }[] = [];
    for (let lat = -70; lat <= 70; lat += 15) {
      for (let lng = -180; lng <= 180; lng += 20) {
        const proj = projectToGlobe(lat, lng, rotation);
        if (!proj.visible || proj.depth < 0.15) continue;
        const temp = idwInterpolate(lat, lng, TEMP_GRID);
        points.push({
          x: proj.x,
          y: proj.y,
          color: tempToCSS(temp),
          depth: proj.depth,
        });
      }
    }
    return points;
  }, [rotation, layers.temperatureHeatmap]);

  // Network connections
  const networkLines = useMemo(() => {
    if (!layers.networkConnections) return [];
    const lines: { x1: number; y1: number; x2: number; y2: number; key: string }[] = [];
    const visible = projectedStations.filter((s) => s.visible && s.status !== 'offline');
    for (let i = 0; i < visible.length; i++) {
      for (let j = i + 1; j < visible.length; j++) {
        const dx = visible[i].x - visible[j].x;
        const dy = visible[i].y - visible[j].y;
        if (Math.sqrt(dx * dx + dy * dy) < 120) {
          lines.push({
            x1: visible[i].x, y1: visible[i].y,
            x2: visible[j].x, y2: visible[j].y,
            key: `${visible[i].id}-${visible[j].id}`,
          });
        }
      }
    }
    return lines;
  }, [projectedStations, layers.networkConnections]);

  return (
    <Box sx={{ bgcolor: colors.bg.primary, color: colors.text.primary, minHeight: '100vh', p: 3 }}>
      <Typography sx={{ fontSize: '2rem', fontWeight: 700, mb: 1 }}>
        Global Weather Network
      </Typography>
      <Typography sx={{ fontSize: '0.875rem', color: colors.text.secondary, mb: 3 }}>
        Real-time visualization of {stations.length} WRFCoin weather stations worldwide
      </Typography>

      <Grid container spacing={3}>
        {/* Layer Controls */}
        <Grid size={{ xs: 12, md: 2.5 }}>
          {!syntheticLayersAllowed && (
            <Typography variant="caption" data-testid="globe-synthetic-layers-not-live" sx={{ color: colors.text.secondary, display: 'block', mb: 1 }}>
              Wind flow and precipitation layers are illustrative and not live on the testnet; they render only
              under demo surfaces. Stations are live.
            </Typography>
          )}
          <GlobeLayerControls
            layers={layers}
            onToggleLayer={handleLayerToggle}
            layerCounts={layerCounts}
            overlayOpacity={overlayOpacity}
            onOpacityChange={setOverlayOpacity}
            onResetView={handleResetView}
          />
        </Grid>

        {/* Globe */}
        <Grid size={{ xs: 12, md: selectedStation ? 5.5 : 9.5 }}>
          <Box
            ref={containerRef}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
            }}
          >
            {/* Globe container with layered SVG + Canvas */}
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                maxWidth: GLOBE_SIZE,
                aspectRatio: '1',
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            >
              {/* Base SVG layer: globe body, continents, static overlays */}
              <svg
                viewBox={`0 0 ${GLOBE_SIZE} ${GLOBE_SIZE}`}
                width="100%"
                height="100%"
                style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
              >
                <defs>
                  <radialGradient id="globe-gradient" cx="40%" cy="35%" r="55%">
                    <stop offset="0%" stopColor="#1E3A5F" />
                    <stop offset="60%" stopColor="#0F2847" />
                    <stop offset="100%" stopColor="#0A1628" />
                  </radialGradient>
                  <radialGradient id="atmosphere-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="85%" stopColor="transparent" />
                    <stop offset="95%" stopColor={`${colors.brand.primary}22`} />
                    <stop offset="100%" stopColor={`${colors.brand.primary}08`} />
                  </radialGradient>
                  <radialGradient id="specular-highlight" cx="35%" cy="30%" r="35%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                  <clipPath id="globe-clip">
                    <circle cx={GLOBE_CENTER} cy={GLOBE_CENTER} r={GLOBE_RADIUS} />
                  </clipPath>
                  <filter id="glow-filter">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <style>{`
                    @keyframes stationPulse {
                      0% { r: 5; opacity: 1; }
                      50% { r: 10; opacity: 0.3; }
                      100% { r: 5; opacity: 1; }
                    }
                  `}</style>
                </defs>

                {/* Atmosphere rings */}
                <circle cx={GLOBE_CENTER} cy={GLOBE_CENTER} r={GLOBE_RADIUS + 20} fill="none" stroke={`${colors.brand.primary}18`} strokeWidth="8" />
                <circle cx={GLOBE_CENTER} cy={GLOBE_CENTER} r={GLOBE_RADIUS + 16} fill="none" stroke={`${colors.brand.primary}10`} strokeWidth="4" />

                {/* Globe body */}
                <circle cx={GLOBE_CENTER} cy={GLOBE_CENTER} r={GLOBE_RADIUS} fill="url(#globe-gradient)" />
                <circle cx={GLOBE_CENTER} cy={GLOBE_CENTER} r={GLOBE_RADIUS} fill="url(#atmosphere-glow)" />

                {/* Latitude grid lines */}
                {[-60, -30, 0, 30, 60].map((lat) => {
                  const pos = projectToGlobe(lat, 0, 0);
                  const r = GLOBE_RADIUS * Math.cos((lat * Math.PI) / 180);
                  return (
                    <ellipse
                      key={`lat-${lat}`}
                      cx={GLOBE_CENTER}
                      cy={pos.y}
                      rx={r}
                      ry={r * 0.15}
                      fill="none"
                      stroke={`${colors.border.default}30`}
                      strokeWidth="0.5"
                    />
                  );
                })}

                {/* Continents */}
                {continentPaths.map((cp) =>
                  cp && (
                    <path
                      key={cp.name}
                      d={cp.path}
                      fill="#1a4a2e"
                      fillOpacity="0.7"
                      stroke="#2d6b45"
                      strokeWidth="1"
                      strokeLinejoin="round"
                    />
                  ),
                )}

                {/* Temperature heatmap (SVG radial gradient circles) */}
                {layers.temperatureHeatmap && (
                  <g clipPath="url(#globe-clip)">
                    {heatmapCircles.map((pt, i) => (
                      <circle
                        key={`heat-${i}`}
                        cx={pt.x}
                        cy={pt.y}
                        r={22}
                        fill={pt.color}
                        opacity={0.2 * opacityFraction * pt.depth}
                      />
                    ))}
                  </g>
                )}

                {/* Coverage zones */}
                {layers.coverageZones &&
                  projectedStations
                    .filter((s) => s.visible && s.status === 'active')
                    .filter((_, i) => i % 4 === 0)
                    .map((s) => (
                      <circle
                        key={`zone-${s.id}`}
                        cx={s.x}
                        cy={s.y}
                        r={45}
                        fill={`${colors.brand.primary}10`}
                        stroke={`${colors.brand.primary}30`}
                        strokeWidth="1"
                        strokeDasharray="4 4"
                        opacity={opacityFraction}
                      />
                    ))}

                {/* Network connections */}
                {networkLines.map((line) => (
                  <line
                    key={line.key}
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    stroke={`${colors.brand.primary}40`}
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity={opacityFraction}
                  />
                ))}

                {/* Station markers - clusters or individual */}
                {layers.stations &&
                  stationClusters.map((cluster, ci) => {
                    if (cluster.count > 1) {
                      // Render cluster marker
                      const avgQuality = Math.round(
                        cluster.stations.reduce((s, st) => s + st.qualityScore, 0) / cluster.count,
                      );
                      const hasActive = cluster.stations.some((s) => s.status === 'active');
                      const clusterColor = hasActive ? colors.success.main : colors.warning.main;
                      const clusterRadius = 8 + cluster.count * 1.5;

                      return (
                        <g
                          key={`cluster-${ci}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            // Zoom in to disaggregate
                            setZoomLevel((prev) => Math.min(prev + 0.5, 3));
                          }}
                        >
                          <circle
                            cx={cluster.cx}
                            cy={cluster.cy}
                            r={clusterRadius + 3}
                            fill="none"
                            stroke={clusterColor}
                            strokeWidth="1.5"
                            opacity="0.3"
                          />
                          <circle
                            cx={cluster.cx}
                            cy={cluster.cy}
                            r={clusterRadius}
                            fill={`${colors.bg.secondary}CC`}
                            stroke={clusterColor}
                            strokeWidth="2"
                          />
                          <text
                            x={cluster.cx}
                            y={cluster.cy + 1}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill={colors.text.primary}
                            fontSize="10"
                            fontWeight="700"
                            fontFamily="sans-serif"
                          >
                            {cluster.count}
                          </text>
                          <text
                            x={cluster.cx}
                            y={cluster.cy + clusterRadius + 10}
                            textAnchor="middle"
                            fill={colors.text.muted}
                            fontSize="7"
                            fontFamily="sans-serif"
                          >
                            avg {avgQuality}/100
                          </text>
                        </g>
                      );
                    }

                    // Single station marker
                    const s = cluster.stations[0];
                    const sc = stationColor(s.status);
                    const isHovered = hoveredStation === s.id;
                    const isSelected = selectedStation?.id === s.id;

                    return (
                      <g
                        key={s.id}
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStation(s);
                        }}
                        onMouseEnter={() => setHoveredStation(s.id)}
                        onMouseLeave={() => setHoveredStation(null)}
                      >
                        {s.status === 'active' && (
                          <circle
                            cx={s.x}
                            cy={s.y}
                            r="5"
                            fill="none"
                            stroke={sc}
                            strokeWidth="1.5"
                            opacity="0.5"
                            style={{ animation: 'stationPulse 2.5s ease-in-out infinite' }}
                          />
                        )}
                        <circle
                          cx={s.x}
                          cy={s.y}
                          r={isHovered || isSelected ? 6 : 4}
                          fill={sc}
                          stroke={isSelected ? colors.text.primary : 'none'}
                          strokeWidth={isSelected ? 2 : 0}
                          filter={isHovered ? 'url(#glow-filter)' : undefined}
                        />
                        {/* Wind direction indicator */}
                        {layers.windFlow && syntheticLayersAllowed && s.status !== 'offline' && (
                          <line
                            x1={s.x}
                            y1={s.y}
                            x2={s.x + Math.cos((s.windDirection * Math.PI) / 180) * (8 + s.windSpeed * 0.3)}
                            y2={s.y + Math.sin((s.windDirection * Math.PI) / 180) * (8 + s.windSpeed * 0.3)}
                            stroke={sc}
                            strokeWidth="1"
                            opacity="0.4"
                            markerEnd=""
                          />
                        )}

                        {isHovered && (
                          <g>
                            <rect
                              x={s.x + 10}
                              y={s.y - 38}
                              width={Math.max(s.name.length * 7, 130)}
                              height="50"
                              rx="6"
                              fill={colors.bg.secondary}
                              stroke={colors.border.default}
                              strokeWidth="1"
                              opacity="0.95"
                            />
                            <text
                              x={s.x + 16}
                              y={s.y - 22}
                              fill={colors.text.primary}
                              fontSize="10"
                              fontWeight="600"
                              fontFamily="sans-serif"
                            >
                              {s.name}
                            </text>
                            <text
                              x={s.x + 16}
                              y={s.y - 10}
                              fill={colors.text.secondary}
                              fontSize="9"
                              fontFamily="sans-serif"
                            >
                              {s.temperature}&deg;C | {s.humidity}% RH | {s.windSpeed} km/h
                            </text>
                            <text
                              x={s.x + 16}
                              y={s.y + 2}
                              fill={colors.text.muted}
                              fontSize="8"
                              fontFamily="sans-serif"
                            >
                              Quality: {s.qualityScore}/100
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}

                {/* Specular highlight and rim */}
                <circle cx={GLOBE_CENTER} cy={GLOBE_CENTER} r={GLOBE_RADIUS} fill="url(#specular-highlight)" pointerEvents="none" />
                <circle cx={GLOBE_CENTER} cy={GLOBE_CENTER} r={GLOBE_RADIUS} fill="none" stroke={`${colors.brand.primary}15`} strokeWidth="1.5" />
              </svg>

              {/* Wind particle Canvas layer */}
              <canvas
                ref={windCanvasRef}
                width={GLOBE_SIZE}
                height={GLOBE_SIZE}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 2,
                  pointerEvents: 'none',
                }}
              />

              {/* Precipitation Canvas layer */}
              <canvas
                ref={precipCanvasRef}
                width={GLOBE_SIZE}
                height={GLOBE_SIZE}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 3,
                  pointerEvents: 'none',
                }}
              />

              {/* Zoom indicator */}
              {zoomLevel !== 1 && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    bgcolor: `${colors.bg.secondary}CC`,
                    borderRadius: '6px',
                    px: 1,
                    py: 0.5,
                    zIndex: 4,
                  }}
                >
                  <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted, fontFamily: 'monospace' }}>
                    {zoomLevel.toFixed(1)}x
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Time scrubber */}
            <Box sx={{ width: '100%', maxWidth: GLOBE_SIZE, mt: 2 }}>
              <GlobeTimeScrubber
                currentHour={currentHour}
                onHourChange={setCurrentHour}
                isPlaying={isPlaying}
                onPlayToggle={() => setIsPlaying(!isPlaying)}
              />
            </Box>
          </Box>
        </Grid>

        {/* Station Detail Panel */}
        {selectedStation && (
          <Grid size={{ xs: 12, md: 4 }}>
            <GlobeStationDetail
              station={selectedStation}
              onClose={() => setSelectedStation(null)}
            />
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default WeatherGlobe;
