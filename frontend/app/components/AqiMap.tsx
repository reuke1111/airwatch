"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CityAqi, getAqiTheme } from "@/lib/api";

interface AqiMapProps {
  cities: CityAqi[];
  selectedCity: string | null;
  onSelectCity: (city: string) => void;
}

export default function AqiMap({ cities, selectedCity, onSelectCity }: AqiMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [cityName: string]: L.Marker }>({});

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Check if map is already initialized
    if (!mapInstanceRef.current) {
      // Center map roughly on equator/Indian ocean to show BRICS across Americas, Africa, Europe, Asia
      const map = L.map(mapContainerRef.current, {
        center: [20, 30],
        zoom: 2,
        minZoom: 2,
        maxZoom: 10,
        scrollWheelZoom: false,
      });

      // OpenStreetMap free tile layer (no API key required)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    // Add markers for all 8 BRICS cities
    cities.forEach((city) => {
      const theme = getAqiTheme(city.aqi);
      const isSelected = selectedCity === city.city;

      // Custom HTML Marker with pulsing aura & color-coded badge
      const markerHtml = `
        <div class="cursor-pointer group flex flex-col items-center select-none" style="transform: translate(-50%, -50%);">
          <div style="background-color: ${theme.hex}; opacity: ${isSelected ? "0.6" : "0.35"}; width: ${isSelected ? "38px" : "28px"}; height: ${isSelected ? "38px" : "28px"};" class="absolute rounded-full marker-pulse pointer-events-none"></div>
          <div style="background-color: ${theme.hex}; border: 2px solid ${isSelected ? "#ffffff" : "rgba(255,255,255,0.85)"}; box-shadow: 0 0 12px ${theme.hex};" class="relative z-10 px-2.5 py-1 rounded-full text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-transform group-hover:scale-110">
            <span>${city.city}</span>
            <span class="bg-black/25 text-zinc-950 px-1.5 py-0.5 rounded text-[10px] font-extrabold">${city.aqi !== null ? city.aqi : "—"}</span>
          </div>
          <div style="border-top-color: ${theme.hex};" class="w-0 h-0 border-x-4 border-x-transparent border-t-6 -mt-[1px]"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: markerHtml,
        iconSize: [80, 40],
        iconAnchor: [40, 30],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([city.lat, city.lng], { icon: customIcon }).addTo(map);

      const popupContent = `
        <div class="p-3 text-left min-w-[200px] font-sans">
          <div class="flex items-center justify-between gap-2 border-b border-zinc-700 pb-2 mb-2">
            <div>
              <h3 class="font-bold text-white text-base leading-tight">${city.city}</h3>
              <p class="text-[11px] text-zinc-400">${city.country}</p>
            </div>
            <span style="background-color: ${theme.hex}22; color: ${theme.hex}; border: 1px solid ${theme.hex}66;" class="text-xs font-semibold px-2 py-0.5 rounded-full">
              ${theme.label}
            </span>
          </div>
          <div class="flex items-baseline justify-between mb-2">
            <span class="text-xs text-zinc-400">Current AQI</span>
            <span style="color: ${theme.hex}" class="text-2xl font-black">${city.aqi ?? "N/A"}</span>
          </div>
          <div class="flex items-center justify-between text-[11px] text-zinc-300 mb-3 bg-zinc-800/80 px-2 py-1 rounded">
            <span>Dominant Pollutant:</span>
            <span class="font-bold text-amber-400">${city.dominant_pollutant ?? "Unknown"}</span>
          </div>
          <button id="view-city-${city.city.toLowerCase().replace(/\s+/g, "-")}" class="w-full text-center py-1.5 px-3 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow">
            View AI Forecast & Details &rarr;
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, { closeButton: false });

      marker.on("click", () => {
        onSelectCity(city.city);
      });

      marker.on("popupopen", () => {
        const btnId = `view-city-${city.city.toLowerCase().replace(/\s+/g, "-")}`;
        const btn = document.getElementById(btnId);
        if (btn) {
          btn.onclick = () => {
            onSelectCity(city.city);
            marker.closePopup();
          };
        }
      });

      markersRef.current[city.city] = marker;
    });

    // Handle selected city pan
    if (selectedCity && markersRef.current[selectedCity]) {
      const selected = cities.find((c) => c.city === selectedCity);
      if (selected) {
        map.flyTo([selected.lat, selected.lng], 5, {
          duration: 1.2,
        });
        markersRef.current[selectedCity].openPopup();
      }
    }
  }, [cities, selectedCity, onSelectCity]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[360px] md:h-[460px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-950/70">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-zinc-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 shadow-lg text-[11px] flex flex-wrap items-center gap-2.5 max-w-[95%]">
        <span className="font-semibold text-zinc-300">AQI Index:</span>
        <span className="inline-flex items-center gap-1 text-zinc-300">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00C853]"></span> 0-50 Good
        </span>
        <span className="inline-flex items-center gap-1 text-zinc-300">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFD600]"></span> 51-100 Mod
        </span>
        <span className="inline-flex items-center gap-1 text-zinc-300">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF6D00]"></span> 101-150 Sens
        </span>
        <span className="inline-flex items-center gap-1 text-zinc-300">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D50000]"></span> 151-200 Unhealthy
        </span>
        <span className="inline-flex items-center gap-1 text-zinc-300">
          <span className="w-2.5 h-2.5 rounded-full bg-[#6A1B9A]"></span> 200+ Haz
        </span>
      </div>
    </div>
  );
}
