import React from 'react';

/**
 * Ten inline SVG weather glyphs (stroke icons, 24-unit grid) keyed by the names forecastModel.iconFor
 * returns. Rendered as an <svg> so the same component works standalone and nested inside a chart axis.
 */
const PATHS = {
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  cloud: <path d="M17.5 19a4.5 4.5 0 0 0 .4-9A7 7 0 0 0 4.3 12.5 3.5 3.5 0 0 0 6 19z" />,
  'cloud-sun': <><path d="M12 2v2M4.9 4.9l1.4 1.4M2 12h2M19.1 4.9l-1.4 1.4" /><path d="M8.5 8.5a4 4 0 0 1 7 2.7" /><path d="M17.5 20a3.5 3.5 0 0 0 .3-7A5.5 5.5 0 0 0 7.2 14.6 2.8 2.8 0 0 0 8 20z" /></>,
  'cloud-moon': <><path d="M14 3.6a5 5 0 0 0 5.6 6.1" /><path d="M17.5 20a3.5 3.5 0 0 0 .3-7A5.5 5.5 0 0 0 7.2 14.6 2.8 2.8 0 0 0 8 20z" /></>,
  rain: <><path d="M17.5 15a4.5 4.5 0 0 0 .4-9A7 7 0 0 0 4.3 8.5 3.5 3.5 0 0 0 6 15z" /><path d="M8 18v3M12 17v4M16 18v3" /></>,
  snow: <><path d="M17.5 14a4.5 4.5 0 0 0 .4-9A7 7 0 0 0 4.3 7.5 3.5 3.5 0 0 0 6 14z" /><path d="M8 17h.01M12 19h.01M16 17h.01M10 21h.01M14 21h.01" /></>,
  thunder: <><path d="M17.5 14a4.5 4.5 0 0 0 .4-9A7 7 0 0 0 4.3 7.5 3.5 3.5 0 0 0 6 14z" /><path d="M13 13l-2 4h3l-2 4" /></>,
  wind: <path d="M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h8a2 2 0 1 1-2 2" />,
  fog: <><path d="M17.5 13a4.5 4.5 0 0 0 .4-9A7 7 0 0 0 4.3 6.5 3.5 3.5 0 0 0 6 13z" /><path d="M5 17h14M7 21h10" /></>,
  drop: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />,
  pin: <><path d="M12 22s7-7.3 7-12a7 7 0 1 0-14 0c0 4.7 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></>,
  crosshair: <><circle cx="12" cy="12" r="7" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></>,
  gauge: <><path d="M5 19a9 9 0 1 1 14 0" /><path d="M12 13l4-4" /><circle cx="12" cy="13" r="1" /></>,
};

export const WEATHER_ICON_NAMES = Object.keys(PATHS);

export default function WeatherIcon({ name, size = 24, title, className, ...rest }) {
  const body = PATHS[name];
  if (!body) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={className}
      data-icon={name}
      {...rest}
    >
      {body}
    </svg>
  );
}
