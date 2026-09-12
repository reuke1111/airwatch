from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any

import httpx

WAQI_BASE = "https://api.waqi.info/feed"

CITY_TARGETS = [
    ("Delhi", "delhi"),
    ("Mumbai", "mumbai"),
    ("Beijing", "beijing"),
    ("Shanghai", "shanghai"),
    ("Moscow", "moscow"),
    ("São Paulo", "sao-paulo"),
    ("Cairo", "cairo"),
    ("Johannesburg", "johannesburg"),
]


@dataclass
class CityAqiResult:
    city: str
    aqi: int | None
    dominant_pollutant: str | None
    timestamp: str | None
    error: str | None = None


class OpenAQClient:
    def __init__(self, api_key: str) -> None:
        self._token = api_key

    async def fetch_all_cities(self) -> list[CityAqiResult]:
        async with httpx.AsyncClient(timeout=30.0) as client:
            tasks = [self._fetch_city(client, display, slug) for display, slug in CITY_TARGETS]
            return list(await asyncio.gather(*tasks))

    async def _fetch_city(
        self, client: httpx.AsyncClient, display_name: str, slug: str
    ) -> CityAqiResult:
        try:
            url = f"{WAQI_BASE}/{slug}/?token={self._token}"
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()

            if data.get("status") != "ok":
                return CityAqiResult(
                    city=display_name,
                    aqi=None,
                    dominant_pollutant=None,
                    timestamp=None,
                    error=f"WAQI error: {data.get('data', 'unknown error')}",
                )

            d = data["data"]
            aqi_raw = d.get("aqi")
            aqi = int(aqi_raw) if aqi_raw and str(aqi_raw).lstrip("-").isdigit() else None
            dominant = d.get("dominentpol")
            timestamp = (d.get("time") or {}).get("iso")

            return CityAqiResult(
                city=display_name,
                aqi=aqi,
                dominant_pollutant=dominant.upper() if dominant else None,
                timestamp=timestamp,
            )

        except httpx.HTTPStatusError as exc:
            return CityAqiResult(
                city=display_name,
                aqi=None,
                dominant_pollutant=None,
                timestamp=None,
                error=f"HTTP {exc.response.status_code}: {exc.response.text[:200]}",
            )
        except Exception as exc:
            return CityAqiResult(
                city=display_name,
                aqi=None,
                dominant_pollutant=None,
                timestamp=None,
                error=str(exc),
            )