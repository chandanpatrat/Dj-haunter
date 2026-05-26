/**
 * Geocoding and Proximity Search Utilities for DJ Haunter
 */

// High-precision static coordinate database for Indian locations,
// prioritizing the Odisha region where active DJs are registered.
const STATIC_LOCATIONS = {
  // States
  'odisha': { lat: 20.9517, lng: 85.0985, type: 'state' },
  'orissa': { lat: 20.9517, lng: 85.0985, type: 'state' },
  'maharashtra': { lat: 19.7515, lng: 75.7139, type: 'state' },
  'karnataka': { lat: 15.3173, lng: 75.7139, type: 'state' },
  'west bengal': { lat: 22.9868, lng: 87.8550, type: 'state' },
  'delhi': { lat: 28.7041, lng: 77.1025, type: 'state' },

  // Districts
  'dhenkanal': { lat: 20.8465, lng: 85.6015, type: 'district' },
  'khordha': { lat: 20.1885, lng: 85.6172, type: 'district' },
  'khurda': { lat: 20.1885, lng: 85.6172, type: 'district' },
  'cuttack': { lat: 20.4625, lng: 85.8830, type: 'district' },
  'angul': { lat: 20.8354, lng: 85.1030, type: 'district' },
  'puri': { lat: 19.8135, lng: 85.8312, type: 'district' },
  'balasore': { lat: 21.4934, lng: 86.9337, type: 'district' },
  'baleswar': { lat: 21.4934, lng: 86.9337, type: 'district' },
  'sambalpur': { lat: 21.4669, lng: 83.9812, type: 'district' },
  'ganjam': { lat: 19.6800, lng: 84.4500, type: 'district' },
  'bhadrak': { lat: 21.0600, lng: 86.5000, type: 'district' },
  'jajpur': { lat: 20.8500, lng: 86.3300, type: 'district' },

  // Cities & Towns
  'kamakhyanagar': { lat: 20.9304, lng: 85.5866, type: 'city' },
  'kualo': { lat: 20.9701, lng: 85.2536, type: 'city' },
  'bhubaneswar': { lat: 20.2961, lng: 85.8245, type: 'city' },
  'talcher': { lat: 20.9520, lng: 85.2155, type: 'city' },
  'rourkela': { lat: 22.2604, lng: 84.8536, type: 'city' },
  'berhampur': { lat: 19.3150, lng: 84.7941, type: 'city' },
  'balasore town': { lat: 21.4950, lng: 86.9250, type: 'city' },
  'baripada': { lat: 21.9320, lng: 86.7510, type: 'city' },
  'national': { lat: 20.5937, lng: 78.9629, type: 'state' },
  'india': { lat: 20.5937, lng: 78.9629, type: 'state' },

  // Pincode approximations (for exact database match)
  '759028': { lat: 20.9304, lng: 85.5866, type: 'city' }, // Kamakhyanagar
  '759120': { lat: 20.9701, lng: 85.2536, type: 'city' }, // Kualo
  '751001': { lat: 20.2961, lng: 85.8245, type: 'city' }, // BBSR GPO
  '751024': { lat: 20.2500, lng: 85.8000, type: 'city' }, // BBSR Patia
};

// In-memory runtime cache to save geolocation results during session lifecycle
const geocodingCache = {};

/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 *
 * @param {number} lat1 - Latitude of the first point in degrees
 * @param {number} lon1 - Longitude of the first point in degrees
 * @param {number} lat2 - Latitude of the second point in degrees
 * @param {number} lon2 - Longitude of the second point in degrees
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Converts a text address/query (city, district, state, or pincode) to geographic coordinates.
 * Utilizes a static dictionary of major regions for instant resolution, with a
 * cached fallback to the OpenStreetMap Nominatim API for general queries.
 *
 * @param {string} query - The search query term or address
 * @returns {Promise<{lat: number, lng: number, type: 'state'|'district'|'city'}|null>} Geographic location metadata
 */
export async function geocodeAddress(query) {
  if (!query || typeof query !== 'string') return null;
  
  const normalizedQuery = query.trim().toLowerCase();
  
  // 1. Direct Static Match Check
  if (STATIC_LOCATIONS[normalizedQuery]) {
    return STATIC_LOCATIONS[normalizedQuery];
  }
  
  // 2. Partial Static Match Check (e.g. "kamakhyanagar, dhenkanal" -> matches "kamakhyanagar")
  for (const [key, loc] of Object.entries(STATIC_LOCATIONS)) {
    if (normalizedQuery.includes(key) || key.includes(normalizedQuery)) {
      return loc;
    }
  }
  
  // 3. Runtime Memory Cache Check
  if (geocodingCache[normalizedQuery]) {
    return geocodingCache[normalizedQuery];
  }
  
  // 4. Remote Geocoding Fallback via OpenStreetMap Nominatim
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=1`,
      {
        headers: {
          'User-Agent': 'DJHaunterProximitySearchEngine/1.0 (contact: info@djhaunter.com)'
        }
      }
    );
    
    if (!response.ok) throw new Error('OSM Nominatim API request unsuccessful');
    
    const results = await response.json();
    
    if (results && results.length > 0) {
      const match = results[0];
      const lat = parseFloat(match.lat);
      const lng = parseFloat(match.lon);
      
      // Heuristic to detect location types from Nominatim attributes
      let type = 'city';
      const matchClass = match.class || '';
      const matchType = match.type || '';
      const displayName = (match.display_name || '').toLowerCase();
      
      if (matchType === 'state' || matchClass === 'boundary' && displayName.includes('state')) {
        type = 'state';
      } else if (matchType === 'administrative' || displayName.includes('district') || displayName.includes('county')) {
        type = 'district';
      }
      
      const geocodedResult = { lat, lng, type };
      
      // Save result in runtime cache
      geocodingCache[normalizedQuery] = geocodedResult;
      return geocodedResult;
    }
  } catch (error) {
    console.error(`Dynamic geocoding failed for: "${query}":`, error);
  }
  
  return null;
}
