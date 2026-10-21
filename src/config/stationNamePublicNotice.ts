/**
 * Owner ruling 2026-09-27 (Stage 1.5 Q4 = A): the station name the owner types
 * stays public. The public map and station page show it verbatim to anonymous
 * visitors (backend weather-routes.js keeps `name` in the anonymous projection),
 * and it is the one field the 0.01-degree coordinate coarsening cannot protect.
 * Every form that sets the name must say so.
 */
export const STATION_NAME_PUBLIC_NOTICE =
  'This name is public: anyone can see it on the station map. Do not include your address or other personal details.';
