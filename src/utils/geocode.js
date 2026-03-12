/**
 * Geocoding cache and helper for Google Maps.
 * Caches results in memory to avoid repeated Geocoder requests for the same address.
 */

const geocodeCache = new Map();

/**
 * Geocode a single address using Google Geocoder.
 * @param {string} address - Full address string
 * @param {google.maps.Geocoder} geocoder - Google Geocoder instance
 * @returns {Promise<{ lat: number, lng: number } | null>}
 */
export async function geocodeAddress(address, geocoder) {
  if (!address || typeof address !== 'string') return null;
  const key = address.trim().toLowerCase();
  if (geocodeCache.has(key)) {
    return geocodeCache.get(key);
  }
  return new Promise((resolve) => {
    geocoder.geocode({ address: address.trim() }, (results, status) => {
      if (status === 'OK' && results?.[0]?.geometry?.location) {
        const loc = results[0].geometry.location;
        const result = { lat: loc.lat(), lng: loc.lng() };
        geocodeCache.set(key, result);
        resolve(result);
      } else {
        geocodeCache.set(key, null);
        resolve(null);
      }
    });
  });
}

/**
 * Geocode multiple addresses with batching to avoid rate limits.
 * @param {Array<{ address: string, job: object }>} items - Items with address and payload
 * @param {google.maps.Geocoder} geocoder
 * @param {number} delayMs - Delay between requests
 * @returns {Promise<Array<{ job: object, lat: number, lng: number }>>}
 */
export async function geocodeJobs(items, geocoder, delayMs = 80) {
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  const out = [];
  for (const { address, job } of items) {
    const coords = await geocodeAddress(address, geocoder);
    if (coords) out.push({ job, ...coords });
    await delay(delayMs);
  }
  return out;
}

/** Get address string from estimate (various API shapes) */
export function getEstimateAddress(estimate) {
  if (!estimate) return "";
  const addr = estimate.address || estimate.street_address;
  if (addr && typeof addr === "string") return addr.trim();
  const obj = estimate.address_object || estimate.address;
  if (obj && typeof obj === "object") {
    const parts = [
      obj.street_address,
      obj.city,
      obj.state,
      obj.postal_code,
    ].filter(Boolean);
    return parts.join(", ").trim();
  }
  return "";
}
