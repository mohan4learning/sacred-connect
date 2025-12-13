// India Location API integration for comprehensive location data

const API_BASE = 'https://india-location-hub.in/api';

// Cache for API responses
const cache: {
  states?: { id: number; name: string }[];
  districts: Record<string, { id: number; name: string; state_id: number }[]>;
  searchResults: Record<string, { name: string; type: string; parent?: string }[]>;
} = {
  districts: {},
  searchResults: {},
};

// Fallback data for when API is unavailable
const fallbackCities = [
  "Mumbai", "Delhi", "Bangalore", "Pune", "Hyderabad", "Chennai", "Kolkata",
  "Ahmedabad", "Jaipur", "Lucknow", "Chandigarh", "Kochi", "Varanasi", "Indore",
  "Nagpur", "Bhopal", "Visakhapatnam", "Coimbatore", "Mysore", "Surat", "Vadodara",
  "Patna", "Bhubaneswar", "Guwahati", "Ranchi", "Thiruvananthapuram", "Agra",
  "Kanpur", "Nashik", "Rajkot", "Madurai", "Vijayawada", "Jodhpur", "Raipur",
  "Goa", "Dehradun", "Shimla", "Amritsar", "Ludhiana", "Jalandhar", "Noida",
  "Gurgaon", "Faridabad", "Ghaziabad", "Thane", "Navi Mumbai", "Howrah"
];

export interface LocationResult {
  name: string;
  type: 'state' | 'district' | 'city' | 'taluka' | 'village';
  parent?: string;
  fullName?: string;
}

// Fetch all states
export const fetchStates = async (): Promise<string[]> => {
  if (cache.states) {
    return cache.states.map(s => s.name);
  }
  
  try {
    const response = await fetch(`${API_BASE}/locations/states`);
    if (!response.ok) throw new Error('API unavailable');
    const data = await response.json();
    cache.states = data.data || data;
    return (cache.states || []).map(s => s.name);
  } catch (error) {
    console.warn('Using fallback cities due to API error:', error);
    return fallbackCities;
  }
};

// Fetch districts for a state
export const fetchDistricts = async (stateName: string): Promise<string[]> => {
  const cacheKey = stateName.toLowerCase();
  if (cache.districts[cacheKey]) {
    return cache.districts[cacheKey].map(d => d.name);
  }
  
  try {
    const response = await fetch(`${API_BASE}/locations/districts?state=${encodeURIComponent(stateName)}`);
    if (!response.ok) throw new Error('API unavailable');
    const data = await response.json();
    cache.districts[cacheKey] = data.data || data;
    return (cache.districts[cacheKey] || []).map(d => d.name);
  } catch (error) {
    console.warn('Error fetching districts:', error);
    return [];
  }
};

// Search locations with fuzzy matching
export const searchLocations = async (query: string): Promise<LocationResult[]> => {
  if (!query || query.length < 2) return [];
  
  const cacheKey = query.toLowerCase();
  if (cache.searchResults[cacheKey]) {
    return cache.searchResults[cacheKey] as LocationResult[];
  }
  
  try {
    const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}&limit=15`);
    if (!response.ok) throw new Error('API unavailable');
    const data = await response.json();
    
    const results: LocationResult[] = (data.data || data || []).map((item: any) => ({
      name: item.name,
      type: item.type || 'city',
      parent: item.state || item.district || item.parent,
      fullName: item.state ? `${item.name}, ${item.state}` : item.name,
    }));
    
    cache.searchResults[cacheKey] = results;
    return results;
  } catch (error) {
    console.warn('Search API error, using fallback:', error);
    // Fallback to local search
    const lowerQuery = query.toLowerCase();
    return fallbackCities
      .filter(city => city.toLowerCase().includes(lowerQuery))
      .slice(0, 10)
      .map(city => ({ name: city, type: 'city' as const }));
  }
};

// Get cities - now fetches from API or uses fallback
export const getCities = async (): Promise<string[]> => {
  try {
    const states = await fetchStates();
    return states.length > 0 ? states : fallbackCities;
  } catch {
    return fallbackCities;
  }
};

// Search cities with API
export const searchCities = async (query: string): Promise<string[]> => {
  if (!query.trim()) {
    return fallbackCities.slice(0, 15);
  }
  
  const results = await searchLocations(query);
  const cityNames = results
    .filter(r => r.type === 'district' || r.type === 'city' || r.type === 'state')
    .map(r => r.fullName || r.name);
  
  if (cityNames.length === 0) {
    // Fallback to local filter
    const lowerQuery = query.toLowerCase();
    return fallbackCities.filter(city => 
      city.toLowerCase().includes(lowerQuery)
    ).slice(0, 10);
  }
  
  return cityNames;
};

// Search areas within a city/district
export const searchAreas = async (city: string, query: string): Promise<string[]> => {
  if (!city) return [];
  
  try {
    // Search for talukas/villages within the district
    const searchQuery = query ? `${query} ${city}` : city;
    const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(searchQuery)}&limit=20`);
    if (!response.ok) throw new Error('API unavailable');
    const data = await response.json();
    
    const results = (data.data || data || [])
      .filter((item: any) => item.type === 'taluka' || item.type === 'village')
      .map((item: any) => item.name)
      .slice(0, 15);
    
    return results.length > 0 ? results : [`${city} Central`, `${city} North`, `${city} South`, `${city} East`, `${city} West`];
  } catch (error) {
    console.warn('Area search error:', error);
    return [`${city} Central`, `${city} North`, `${city} South`, `${city} East`, `${city} West`];
  }
};

// Synchronous versions for backward compatibility (uses cached data)
export const getCitiesSync = (): string[] => {
  if (cache.states && cache.states.length > 0) {
    return cache.states.map(s => s.name);
  }
  return fallbackCities;
};

export const searchCitiesSync = (query: string): string[] => {
  if (!query.trim()) return fallbackCities.slice(0, 15);
  const lowerQuery = query.toLowerCase();
  
  // Check cache first
  const cached = cache.searchResults[lowerQuery];
  if (cached) {
    return cached.map(r => (r as LocationResult).fullName || r.name);
  }
  
  // Fallback to local filter
  return fallbackCities.filter(city => 
    city.toLowerCase().includes(lowerQuery)
  ).slice(0, 10);
};

// Legacy exports for backward compatibility
export const getAreasForCity = (city: string): string[] => {
  return [`${city} Central`, `${city} North`, `${city} South`, `${city} East`, `${city} West`];
};
