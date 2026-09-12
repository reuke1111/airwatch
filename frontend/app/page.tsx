"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { CityAqi, fetchLiveAqi, getAqiTheme, FALLBACK_CITIES } from "@/lib/api";
import CityDetail from "./components/CityDetail";

// Dynamic import for Leaflet map to prevent SSR issues
const AqiMap = dynamic(() => import("./components/AqiMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[360px] md:h-[460px] rounded-2xl bg-zinc-900/60 border border-white/10 flex flex-col items-center justify-center text-zinc-400 gap-3 animate-pulse">
      <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      <span className="text-xs font-medium">Initializing BRICS Geospatial Air Map...</span>
    </div>
  ),
});

export default function Home() {
  const [cities, setCities] = useState<CityAqi[]>(FALLBACK_CITIES);
  const [selectedCityName, setSelectedCityName] = useState<string | null>("Delhi");
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    setTimeString(lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, [lastRefreshed]);

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchLiveAqi();
      setCities(data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Failed to load AQI data", err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const data = await fetchLiveAqi();
        if (!ignore) {
          setCities(data);
          setLastRefreshed(new Date());
        }
      } catch (err) {
        console.error("Failed to load AQI data", err);
      }
    }

    init();
    const interval = setInterval(init, 60000);
    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, []);

  const selectedCity = cities.find((c) => c.city === selectedCityName) || cities[0];

  // Aggregate stats
  const validAqis = cities.map((c) => c.aqi).filter((val): val is number => val !== null);
  const avgAqi = validAqis.length > 0 ? Math.round(validAqis.reduce((a, b) => a + b, 0) / validAqis.length) : null;
  const maxCity = cities.slice().sort((a, b) => (b.aqi ?? 0) - (a.aqi ?? 0))[0];
  const minCity = cities.slice().sort((a, b) => (a.aqi ?? 999) - (b.aqi ?? 999))[0];

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Header */}
      <header className="border-b border-white/10 bg-zinc-900/70 backdrop-blur-xl sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <svg className="w-6 h-6 text-zinc-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                  d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">AirWatch</h1>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Live BRICS
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium">
                AI-Powered Air Quality Forecasting for BRICS Cities
              </p>
            </div>
          </div>
        </div>

        {/* Status indicator & Refresh Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end text-xs">
          <div className="hidden sm:flex items-center gap-2 text-zinc-400 bg-zinc-800/60 px-3 py-1.5 rounded-lg border border-white/5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Updated: {timeString}</span>
          </div>

          <button
            onClick={loadData}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 transition-colors cursor-pointer text-xs font-semibold disabled:opacity-50"
            title="Refresh AQI Feeds"
          >
            <svg
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </header>

      {/* Main Content Layout with Detail Panel */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left / Center Dashboard Stream */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
          {/* Quick Metrics Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-3.5">
              <span className="text-zinc-400 text-xs">Monitored Metros</span>
              <div className="text-xl font-bold text-white mt-1">8 BRICS Capitals</div>
            </div>
            <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-3.5">
              <span className="text-zinc-400 text-xs">Average AQI</span>
              <div className="text-xl font-bold text-amber-400 mt-1">
                {avgAqi ?? "—"} <span className="text-xs text-zinc-400 font-normal">Moderate</span>
              </div>
            </div>
            <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-3.5">
              <span className="text-zinc-400 text-xs">Cleanest Air</span>
              <div className="text-xl font-bold text-emerald-400 mt-1 flex items-center justify-between">
                <span>{minCity ? minCity.city : "—"}</span>
                <span className="text-sm font-semibold">{minCity?.aqi}</span>
              </div>
            </div>
            <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-3.5">
              <span className="text-zinc-400 text-xs">Highest AQI</span>
              <div className="text-xl font-bold text-red-400 mt-1 flex items-center justify-between">
                <span>{maxCity ? maxCity.city : "—"}</span>
                <span className="text-sm font-semibold">{maxCity?.aqi}</span>
              </div>
            </div>
          </div>

          {/* Map Section */}
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-200 flex items-center gap-2">
                <span>Geospatial AQI Radar</span>
                <span className="text-xs font-normal text-zinc-400">Click any marker to inspect</span>
              </h2>
            </div>
            <AqiMap
              cities={cities}
              selectedCity={selectedCityName}
              onSelectCity={(name) => setSelectedCityName(name)}
            />
          </section>

          {/* Grid of 8 City Cards */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">BRICS Cities Live Forecast</h2>
                <p className="text-xs text-zinc-400">
                  Select a card to examine SHAP-attributed machine learning forecast drivers
                </p>
              </div>
              <span className="text-xs text-zinc-400 font-medium">8 Cities</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {cities.map((city) => {
                const isSelected = selectedCityName === city.city;
                const theme = getAqiTheme(city.aqi);
                const predictedTheme = getAqiTheme(city.predicted_aqi);

                return (
                  <div
                    key={city.city}
                    onClick={() => setSelectedCityName(city.city)}
                    style={{
                      borderColor: isSelected ? theme.hex : "rgba(255, 255, 255, 0.08)",
                      boxShadow: isSelected ? `0 0 20px -4px ${theme.hex}55` : undefined,
                    }}
                    className={`relative rounded-2xl p-4.5 bg-zinc-900/80 backdrop-blur-md border cursor-pointer transition-all duration-200 hover:border-zinc-500 hover:-translate-y-0.5 group flex flex-col justify-between min-h-[160px] ${
                      isSelected ? "ring-2 ring-white/20" : ""
                    }`}
                  >
                    {/* Top row: City Name + Country + Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-black text-white group-hover:text-emerald-400 transition-colors">
                          {city.city}
                        </h3>
                        <span className="text-[11px] text-zinc-400">{city.country}</span>
                      </div>

                      {/* Color-coded AQI Badge */}
                      <span
                        style={{
                          backgroundColor: `${theme.hex}22`,
                          color: theme.hex,
                          borderColor: `${theme.hex}55`,
                        }}
                        className="px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5"
                      >
                        <span
                          style={{ backgroundColor: theme.hex }}
                          className="w-2 h-2 rounded-full inline-block"
                        />
                        {theme.label}
                      </span>
                    </div>

                    {/* Middle: Live AQI value & Pollutant */}
                    <div className="flex items-baseline justify-between my-2">
                      <div className="flex items-baseline gap-1.5">
                        <span
                          style={{ color: theme.hex }}
                          className="text-3xl font-black tracking-tight"
                        >
                          {city.aqi !== null ? city.aqi : "—"}
                        </span>
                        <span className="text-xs font-semibold text-zinc-400">AQI</span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                          Dominant
                        </span>
                        <span className="text-xs font-bold text-zinc-200 bg-zinc-800/80 px-2 py-0.5 rounded border border-white/5">
                          {city.dominant_pollutant ?? "PM2.5"}
                        </span>
                      </div>
                    </div>

                    {/* Bottom: Predicted AQI for Tomorrow */}
                    <div className="pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                      <span className="text-zinc-400 text-[11px]">Tomorrow Forecast:</span>
                      <div className="flex items-center gap-1.5 font-bold">
                        <span style={{ color: predictedTheme.hex }}>
                          {city.predicted_aqi ?? "—"} AQI
                        </span>
                        {city.predicted_aqi && city.aqi && (
                          <span
                            className={`text-[10px] px-1 rounded ${
                              city.predicted_aqi > city.aqi
                                ? "text-red-400 bg-red-950/40"
                                : "text-emerald-400 bg-emerald-950/40"
                            }`}
                          >
                            {city.predicted_aqi > city.aqi ? "↑ worse" : "↓ cleaner"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </main>

        {/* Right Side Detail Panel */}
        {selectedCity && (
          <CityDetail
            key={selectedCity.city}
            city={selectedCity}
            onClose={() => setSelectedCityName(null)}
          />
        )}
      </div>
    </div>
  );
}
