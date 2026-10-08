export type LatLng = { lat: number; lng: number };

const valid = (lat: number, lng: number) =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);

/**
 * Pulls coordinates out of anything an admin might paste: "-20.15, 28.58",
 * or a Google Maps link in any of its common shapes
 * (…/@lat,lng,17z, …?q=lat,lng, …!3dlat!4dlng, …?query=lat,lng, ll=…, destination=…).
 */
export function parseLatLng(input: string | null | undefined): LatLng | null {
  if (!input) return null;
  const text = decodeURIComponent(input.trim());
  const num = "(-?\\d{1,3}(?:\\.\\d+)?)";
  const patterns = [
    new RegExp(`!3d${num}!4d${num}`), // place pin (most precise)
    new RegExp(`@${num},${num}`), // map centre
    new RegExp(`[?&](?:q|query|ll|destination|daddr|center)=${num},\\s*${num}`),
    new RegExp(`^${num}\\s*,\\s*${num}$`), // plain "lat, lng"
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m && valid(Number(m[1]), Number(m[2]))) return { lat: Number(m[1]), lng: Number(m[2]) };
  }
  return null;
}

/** Link that opens Google Maps at a point (and offers directions on phones). */
export function googleMapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function googleDirectionsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/** Bulawayo city centre, the default map view. */
export const BULAWAYO: LatLng = { lat: -20.15, lng: 28.58 };
