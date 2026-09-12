"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
} from "recharts";
import { CityAqi, ForecastResponse, getAqiTheme, fetchCityForecast } from "@/lib/api";

interface CityDetailProps {
  city: CityAqi;
  onClose: () => void;
}

export default function CityDetail({ city, onClose }: CityDetailProps) {
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [aiTips, setAiTips] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setAiTips(null);
    setAiError(null);
    setAiLoading(false);

    fetchCityForecast(city.city)
      .then((data) => {
        if (isMounted) {
          setForecast(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load forecast for", city.city, err);
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [city.city]);

  const handleGetAiTips = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    setAiError(null);

    try {
      const response = await fetch("/api/health-tips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          city: city.city,
          aqi: city.aqi,
          predicted_aqi: forecast?.predicted_aqi ?? city.predicted_aqi,
          dominant_pollutant: city.dominant_pollutant ?? "PM2.5",
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      setAiTips(data.tips);
    } catch (err: any) {
      console.error("Failed to fetch AI health tips:", err);
      setAiError(err.message || "Failed to load health tips. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const currentTheme = getAqiTheme(city.aqi);
  const predictedTheme = getAqiTheme(forecast?.predicted_aqi ?? city.predicted_aqi);

  // Prepare SHAP chart data
  const shapData = (forecast?.shap_features || []).map((feat, idx) => {
    const rawVal = forecast?.shap_values?.[idx] ?? 0;
    const rounded = Number(rawVal.toFixed(2));
    return {
      feature: feat.replace(/_/g, " "),
      impact: rounded,
      fill: rounded >= 0 ? "#FF6D00" : "#00C853",
    };
  });

  const aqiDelta = forecast
    ? forecast.predicted_aqi - (city.aqi ?? forecast.current_aqi)
    : 0;

  return (
    <aside
      aria-label="City Details and AI Forecast"
      className="w-full lg:w-[420px] bg-zinc-900/95 backdrop-blur-xl border-l border-white/10 p-6 flex flex-col gap-5 overflow-y-auto shadow-2xl transition-all h-full"
    >
      {/* Header with City Name & Close button */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">
            City Air Profile
          </span>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            {city.city}
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
              {city.country}
            </span>
          </h2>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-white/5"
          title="Close panel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Large AQI Metric Display */}
      <div
        style={{ borderColor: `${currentTheme.hex}40` }}
        className="relative overflow-hidden rounded-2xl p-5 border bg-gradient-to-br from-zinc-900 to-zinc-950 shadow-inner"
      >
        <div
          style={{ backgroundColor: currentTheme.hex }}
          className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-15 blur-2xl pointer-events-none"
        />

        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-400">Live Air Quality Index</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                style={{ color: currentTheme.hex }}
                className="text-6xl font-black tracking-tight drop-shadow-sm"
              >
                {city.aqi !== null ? city.aqi : "—"}
              </span>
              <span className="text-sm font-bold text-zinc-400">AQI</span>
            </div>
          </div>

          <span
            style={{
              backgroundColor: `${currentTheme.hex}22`,
              color: currentTheme.hex,
              borderColor: `${currentTheme.hex}55`,
            }}
            className="px-3 py-1 text-xs font-bold rounded-full border shadow-sm"
          >
            {currentTheme.label}
          </span>
        </div>

        {/* Pollutant and Forecast summary row */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80 grid grid-cols-2 gap-3 text-xs">
          <div className="bg-zinc-800/50 p-2 rounded-xl border border-white/5">
            <div className="text-zinc-400 text-[11px]">Dominant Pollutant</div>
            <div className="font-bold text-zinc-100 text-sm mt-0.5">
              {city.dominant_pollutant ?? "PM2.5"}
            </div>
          </div>

          <div className="bg-zinc-800/50 p-2 rounded-xl border border-white/5">
            <div className="text-zinc-400 text-[11px]">Tomorrow Predicted</div>
            <div className="font-bold text-sm mt-0.5 flex items-center gap-1.5">
              <span style={{ color: predictedTheme.hex }}>
                {forecast?.predicted_aqi ?? city.predicted_aqi ?? "—"} AQI
              </span>
              {aqiDelta !== 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    aqiDelta > 0
                      ? "text-red-400 bg-red-950/40"
                      : "text-emerald-400 bg-emerald-950/40"
                  }`}
                >
                  {aqiDelta > 0 ? `+${aqiDelta}` : aqiDelta}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Health Recommendation Card */}
      <div className="rounded-2xl p-4 bg-zinc-800/40 border border-white/5 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-zinc-300 font-semibold text-xs">
          <svg
            className="w-4 h-4 text-emerald-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Health Recommendation</span>
        </div>
        <p className="text-zinc-300 text-sm leading-relaxed">
          {forecast?.recommendation ||
            "Monitor localized air quality conditions before planning intensive outdoor activities."}
        </p>
      </div>

      {/* SHAP Feature Importance Section */}
      <div className="rounded-2xl p-4 bg-zinc-800/40 border border-white/5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              SHAP AI Explanations
            </h3>
            <p className="text-[11px] text-zinc-400">
              Key drivers of the {city.city} 24-hr prediction
            </p>
          </div>
          {forecast?.mae && (
            <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
              MAE: ±{forecast.mae.toFixed(1)}
            </span>
          )}
        </div>

        {loading ? (
          <div className="h-44 w-full flex items-center justify-center text-zinc-500 text-xs animate-pulse">
            Calculating SHAP Shapley values...
          </div>
        ) : shapData.length > 0 ? (
          <div className="w-full">
            <div className="h-48 w-full -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={shapData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fill: "#9ca3af", fontSize: 10 }}
                    stroke="#4b5563"
                  />
                  <YAxis
                    dataKey="feature"
                    type="category"
                    tick={{ fill: "#d1d5db", fontSize: 10 }}
                    stroke="#4b5563"
                    width={90}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-700 shadow-xl text-xs font-sans">
                            <div className="font-bold text-zinc-200">{item.feature}</div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-zinc-400">Impact:</span>
                              <span
                                style={{ color: item.fill }}
                                className="font-bold"
                              >
                                {item.impact > 0 ? `+${item.impact}` : item.impact}
                              </span>
                            </div>
                            <div className="text-[10px] text-zinc-400 mt-1">
                              {item.impact > 0
                                ? "Pushes AQI higher (more pollution)"
                                : "Lowers AQI (cleaner dispersion)"}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine x={0} stroke="#6b7280" />
                  <Bar dataKey="impact" radius={[4, 4, 4, 4]}>
                    {shapData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-[10px] text-zinc-400 px-2 mt-1">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-[#00C853]"></span> Cleans air (- impact)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-[#FF6D00]"></span> Increases AQI (+ impact)
              </span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-zinc-500 text-center py-6">
            Feature contributions not available for this station.
          </div>
        )}
      </div>

      {/* "Get AI Health Tips" Button & AI Health Tips Display */}
      <div className="mt-auto pt-2">
        <button
          onClick={handleGetAiTips}
          disabled={aiLoading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {aiLoading ? (
            <>
              <svg
                className="w-4 h-4 animate-spin text-zinc-950"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              <span>Getting AI Health Tips...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <span>{aiTips ? "Refresh AI Health Tips" : "Get AI Health Tips"}</span>
            </>
          )}
        </button>

        {aiLoading && (
          <div className="mt-3 p-4 rounded-2xl bg-zinc-800/40 border border-emerald-500/20 text-xs text-zinc-300 flex items-center justify-center gap-2.5 animate-pulse">
            <svg
              className="w-4 h-4 animate-spin text-emerald-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <span>Consulting Gemini for personalized health tips...</span>
          </div>
        )}

        {aiError && (
          <div className="mt-3 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
            <p className="font-semibold text-red-400">Unable to load health tips</p>
            <p className="mt-1 text-[11px] text-red-200/80">{aiError}</p>
          </div>
        )}

        {aiTips && (
          <div className="mt-3 p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-zinc-200 flex flex-col gap-2.5 animate-fadeIn">
            <div className="font-bold text-emerald-400 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Gemini AI Health Advisor
              </div>
              <span className="text-[10px] font-normal text-emerald-400/80 bg-emerald-900/40 px-2 py-0.5 rounded border border-emerald-500/20">
                Live AI Advice
              </span>
            </div>

            <p className="text-zinc-300 whitespace-pre-line leading-relaxed text-xs">
              {aiTips}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
