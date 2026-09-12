export interface CityAqi {
  city: string;
  country: string;
  lat: number;
  lng: number;
  aqi: number | null;
  dominant_pollutant: string | null;
  timestamp: string | null;
  predicted_aqi?: number | null;
  error?: string | null;
}

export interface ForecastResponse {
  city: string;
  current_aqi: number;
  predicted_aqi: number;
  mae: number;
  shap_features: string[];
  shap_values: number[];
  recommendation: string;
}

export interface ShapItem {
  feature: string;
  value: number;
  impact: "increases_aqi" | "decreases_aqi";
}

export interface AqiTheme {
  hex: string;
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  badgeClass: string;
  glowClass: string;
}

export const BRICS_METADATA: Record<string, { country: string; lat: number; lng: number; slug: string }> = {
  "Delhi": { country: "India", lat: 28.6139, lng: 77.2090, slug: "delhi" },
  "Mumbai": { country: "India", lat: 19.0760, lng: 72.8777, slug: "mumbai" },
  "Beijing": { country: "China", lat: 39.9042, lng: 116.4074, slug: "beijing" },
  "Shanghai": { country: "China", lat: 31.2304, lng: 121.4737, slug: "shanghai" },
  "Moscow": { country: "Russia", lat: 55.7558, lng: 37.6173, slug: "moscow" },
  "São Paulo": { country: "Brazil", lat: -23.5505, lng: -46.6333, slug: "sao-paulo" },
  "Cairo": { country: "Egypt", lat: 30.0444, lng: 31.2357, slug: "cairo" },
  "Johannesburg": { country: "South Africa", lat: -26.2041, lng: 28.0473, slug: "johannesburg" },
};

export const FALLBACK_CITIES: CityAqi[] = [
  { city: "Delhi", country: "India", lat: 28.6139, lng: 77.2090, aqi: 168, dominant_pollutant: "PM2.5", timestamp: new Date().toISOString(), predicted_aqi: 175 },
  { city: "Mumbai", country: "India", lat: 19.0760, lng: 72.8777, aqi: 112, dominant_pollutant: "PM10", timestamp: new Date().toISOString(), predicted_aqi: 105 },
  { city: "Beijing", country: "China", lat: 39.9042, lng: 116.4074, aqi: 82, dominant_pollutant: "PM2.5", timestamp: new Date().toISOString(), predicted_aqi: 76 },
  { city: "Shanghai", country: "China", lat: 31.2304, lng: 121.4737, aqi: 64, dominant_pollutant: "O3", timestamp: new Date().toISOString(), predicted_aqi: 58 },
  { city: "Moscow", country: "Russia", lat: 55.7558, lng: 37.6173, aqi: 38, dominant_pollutant: "NO2", timestamp: new Date().toISOString(), predicted_aqi: 42 },
  { city: "São Paulo", country: "Brazil", lat: -23.5505, lng: -46.6333, aqi: 95, dominant_pollutant: "PM2.5", timestamp: new Date().toISOString(), predicted_aqi: 89 },
  { city: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357, aqi: 146, dominant_pollutant: "PM10", timestamp: new Date().toISOString(), predicted_aqi: 152 },
  { city: "Johannesburg", country: "South Africa", lat: -26.2041, lng: 28.0473, aqi: 48, dominant_pollutant: "SO2", timestamp: new Date().toISOString(), predicted_aqi: 45 },
];

export const FALLBACK_FORECASTS: Record<string, ForecastResponse> = {
  "delhi": {
    city: "Delhi",
    current_aqi: 168,
    predicted_aqi: 175,
    mae: 14.2,
    shap_features: ["PM2.5 Lag 1", "Wind Speed", "Humidity", "Traffic Density", "Temperature"],
    shap_values: [12.4, -6.8, 5.1, 4.3, -2.1],
    recommendation: "Air quality is Unhealthy. Avoid prolonged outdoor activities.",
  },
  "mumbai": {
    city: "Mumbai",
    current_aqi: 112,
    predicted_aqi: 105,
    mae: 10.5,
    shap_features: ["PM10 Lag 1", "Sea Breeze", "Humidity", "Industrial Emissions", "Temperature"],
    shap_values: [7.8, -5.2, 3.4, 2.9, -1.2],
    recommendation: "Air quality is Unhealthy for Sensitive Groups. Wear a mask outdoors.",
  },
  "beijing": {
    city: "Beijing",
    current_aqi: 82,
    predicted_aqi: 76,
    mae: 8.9,
    shap_features: ["PM2.5 Lag 1", "North Wind", "Heating Load", "Humidity", "Pressure"],
    shap_values: [5.2, -4.8, 3.1, -1.5, 1.0],
    recommendation: "Air quality is Moderate. Sensitive groups should limit outdoor exposure.",
  },
  "shanghai": {
    city: "Shanghai",
    current_aqi: 64,
    predicted_aqi: 58,
    mae: 7.4,
    shap_features: ["O3 Concentration", "Solar Radiation", "Wind Velocity", "Humidity", "Traffic"],
    shap_values: [4.6, 3.2, -3.9, -1.8, 1.5],
    recommendation: "Air quality is Moderate. Sensitive groups should limit outdoor exposure.",
  },
  "moscow": {
    city: "Moscow",
    current_aqi: 38,
    predicted_aqi: 42,
    mae: 5.8,
    shap_features: ["NO2 Levels", "Precipitation", "Wind Speed", "Urban Heating", "Traffic"],
    shap_values: [2.8, -3.4, -2.1, 1.9, 1.2],
    recommendation: "Air quality is Good. Safe for outdoor activities.",
  },
  "sao-paulo": {
    city: "São Paulo",
    current_aqi: 95,
    predicted_aqi: 89,
    mae: 9.1,
    shap_features: ["Vehicle Fleet", "Thermal Inversion", "Humidity", "Wind Speed", "Precipitation"],
    shap_values: [6.4, 4.2, -3.1, -2.5, -1.8],
    recommendation: "Air quality is Moderate. Sensitive groups should limit outdoor exposure.",
  },
  "cairo": {
    city: "Cairo",
    current_aqi: 146,
    predicted_aqi: 152,
    mae: 12.8,
    shap_features: ["Desert Dust (PM10)", "Wind Direction", "Stagnation", "Traffic", "Temperature"],
    shap_values: [11.2, 5.4, 3.8, 2.2, -1.5],
    recommendation: "Air quality is Unhealthy. Avoid prolonged outdoor activities.",
  },
  "johannesburg": {
    city: "Johannesburg",
    current_aqi: 48,
    predicted_aqi: 45,
    mae: 6.2,
    shap_features: ["Highveld Inversion", "Mine Dust", "Wind Speed", "Temperature", "Domestic Burning"],
    shap_values: [3.5, 2.4, -4.1, -1.9, 1.8],
    recommendation: "Air quality is Good. Safe for outdoor activities.",
  },
};

/**
 * Color coding rules:
 * - 0-50: green (#00C853)
 * - 51-100: yellow (#FFD600)
 * - 101-150: orange (#FF6D00)
 * - 151-200: red (#D50000)
 * - 200+: purple (#6A1B9A)
 */
export function getAqiTheme(aqi: number | null | undefined): AqiTheme {
  if (aqi === null || aqi === undefined || isNaN(aqi)) {
    return {
      hex: "#9E9E9E",
      label: "Unknown",
      bgClass: "bg-zinc-100 dark:bg-zinc-800",
      textClass: "text-zinc-500 dark:text-zinc-400",
      borderClass: "border-zinc-300 dark:border-zinc-700",
      badgeClass: "bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
      glowClass: "shadow-zinc-500/20",
    };
  }

  if (aqi <= 50) {
    return {
      hex: "#00C853",
      label: "Good",
      bgClass: "bg-emerald-500/10 dark:bg-emerald-950/40",
      textClass: "text-[#00C853]",
      borderClass: "border-[#00C853]/30",
      badgeClass: "bg-[#00C853]/15 text-[#00a846] dark:text-[#00e676] border-[#00C853]/40",
      glowClass: "shadow-[#00C853]/25",
    };
  } else if (aqi <= 100) {
    return {
      hex: "#FFD600",
      label: "Moderate",
      bgClass: "bg-yellow-500/10 dark:bg-yellow-950/40",
      textClass: "text-amber-500 dark:text-[#FFD600]",
      borderClass: "border-[#FFD600]/30",
      badgeClass: "bg-[#FFD600]/15 text-amber-700 dark:text-[#FFD600] border-[#FFD600]/40",
      glowClass: "shadow-[#FFD600]/25",
    };
  } else if (aqi <= 150) {
    return {
      hex: "#FF6D00",
      label: "Sensitive",
      bgClass: "bg-orange-500/10 dark:bg-orange-950/40",
      textClass: "text-[#FF6D00]",
      borderClass: "border-[#FF6D00]/30",
      badgeClass: "bg-[#FF6D00]/15 text-[#e65100] dark:text-[#FF6D00] border-[#FF6D00]/40",
      glowClass: "shadow-[#FF6D00]/25",
    };
  } else if (aqi <= 200) {
    return {
      hex: "#D50000",
      label: "Unhealthy",
      bgClass: "bg-red-500/10 dark:bg-red-950/40",
      textClass: "text-[#D50000]",
      borderClass: "border-[#D50000]/30",
      badgeClass: "bg-[#D50000]/15 text-[#D50000] border-[#D50000]/40",
      glowClass: "shadow-[#D50000]/25",
    };
  } else {
    return {
      hex: "#6A1B9A",
      label: "Hazardous",
      bgClass: "bg-purple-500/10 dark:bg-purple-950/40",
      textClass: "text-[#9c27b0] dark:text-[#ba68c8]",
      borderClass: "border-[#6A1B9A]/30",
      badgeClass: "bg-[#6A1B9A]/15 text-[#6A1B9A] dark:text-[#ba68c8] border-[#6A1B9A]/40",
      glowClass: "shadow-[#6A1B9A]/25",
    };
  }
}

export function getAqiCategory(aqi: number | null | undefined): string {
  return getAqiTheme(aqi).label;
}

export function getAqiColor(aqi: number | null | undefined): string {
  return getAqiTheme(aqi).hex;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchLiveAqi(): Promise<CityAqi[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${API_BASE_URL}/api/aqi`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`API error: ${res.statusText}`);
    }

    const data = await res.json();
    const apiCities: Array<{ city: string; aqi: number | null; dominant_pollutant: string | null; timestamp: string | null; error?: string }> = data.cities || [];

    // Map each known BRICS city and attach forecast if available
    const merged: CityAqi[] = FALLBACK_CITIES.map((fallback) => {
      const match = apiCities.find(
        (c) => c.city.toLowerCase() === fallback.city.toLowerCase()
      );
      if (match && match.aqi !== null && match.aqi !== undefined) {
        return {
          ...fallback,
          aqi: match.aqi,
          dominant_pollutant: match.dominant_pollutant || fallback.dominant_pollutant,
          timestamp: match.timestamp || fallback.timestamp,
          error: match.error,
        };
      }
      return fallback;
    });

    return merged;
  } catch {
    // If backend is unreachable or not configured, return fallback data
    return FALLBACK_CITIES;
  }
}

export async function fetchCityForecast(cityName: string): Promise<ForecastResponse> {
  const normalized = cityName.toLowerCase().replace(/[\s_]+/g, "-");
  const meta = BRICS_METADATA[cityName] || Object.values(BRICS_METADATA).find((m) => m.slug === normalized);
  const slug = meta ? meta.slug : normalized;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${API_BASE_URL}/api/forecast/${encodeURIComponent(slug)}`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Forecast API failed: ${res.status}`);
    }

    const data: ForecastResponse = await res.json();
    return data;
  } catch {
    // Return mock forecast if backend is offline
    const fallback = FALLBACK_FORECASTS[slug] || FALLBACK_FORECASTS["delhi"];
    return {
      ...fallback,
      city: cityName,
    };
  }
}
