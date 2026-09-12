"""US EPA AQI sub-index calculation from pollutant concentrations."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Breakpoint:
    c_low: float
    c_high: float
    i_low: int
    i_high: int


# Concentration breakpoints aligned with EPA AQI technical guidance.
PM25_BREAKPOINTS = [
    Breakpoint(0.0, 12.0, 0, 50),
    Breakpoint(12.1, 35.4, 51, 100),
    Breakpoint(35.5, 55.4, 101, 150),
    Breakpoint(55.5, 150.4, 151, 200),
    Breakpoint(150.5, 250.4, 201, 300),
    Breakpoint(250.5, 350.4, 301, 400),
    Breakpoint(350.5, 500.4, 401, 500),
]

PM10_BREAKPOINTS = [
    Breakpoint(0, 54, 0, 50),
    Breakpoint(55, 154, 51, 100),
    Breakpoint(155, 254, 101, 150),
    Breakpoint(255, 354, 151, 200),
    Breakpoint(355, 424, 201, 300),
    Breakpoint(425, 504, 301, 400),
    Breakpoint(505, 604, 401, 500),
]

# O3: 8-hour average, ppm
O3_BREAKPOINTS = [
    Breakpoint(0.0, 0.054, 0, 50),
    Breakpoint(0.055, 0.070, 51, 100),
    Breakpoint(0.071, 0.085, 101, 150),
    Breakpoint(0.086, 0.105, 151, 200),
    Breakpoint(0.106, 0.200, 201, 300),
]

# CO: 8-hour average, ppm
CO_BREAKPOINTS = [
    Breakpoint(0.0, 4.4, 0, 50),
    Breakpoint(4.5, 9.4, 51, 100),
    Breakpoint(9.5, 12.4, 101, 150),
    Breakpoint(12.5, 15.4, 151, 200),
    Breakpoint(15.5, 30.4, 201, 300),
    Breakpoint(30.5, 40.4, 301, 400),
    Breakpoint(40.5, 50.4, 401, 500),
]

# NO2 / SO2: 1-hour average, ppb
NO2_BREAKPOINTS = [
    Breakpoint(0, 53, 0, 50),
    Breakpoint(54, 100, 51, 100),
    Breakpoint(101, 360, 101, 150),
    Breakpoint(361, 649, 151, 200),
    Breakpoint(650, 1249, 201, 300),
    Breakpoint(1250, 1649, 301, 400),
    Breakpoint(1650, 2049, 401, 500),
]

SO2_BREAKPOINTS = [
    Breakpoint(0, 35, 0, 50),
    Breakpoint(36, 75, 51, 100),
    Breakpoint(76, 185, 101, 150),
    Breakpoint(186, 304, 151, 200),
    Breakpoint(305, 604, 201, 300),
    Breakpoint(605, 804, 301, 400),
    Breakpoint(805, 1004, 401, 500),
]

POLLUTANT_BREAKPOINTS: dict[str, list[Breakpoint]] = {
    "pm25": PM25_BREAKPOINTS,
    "pm10": PM10_BREAKPOINTS,
    "o3": O3_BREAKPOINTS,
    "co": CO_BREAKPOINTS,
    "no2": NO2_BREAKPOINTS,
    "so2": SO2_BREAKPOINTS,
}

DISPLAY_NAMES: dict[str, str] = {
    "pm25": "PM2.5",
    "pm10": "PM10",
    "o3": "O₃",
    "co": "CO",
    "no2": "NO₂",
    "so2": "SO₂",
}


def _to_ppb(value: float, units: str) -> float | None:
    u = units.lower().replace("³", "3").replace("µ", "u")
    if "ppb" in u:
        return value
    if "ppm" in u:
        return value * 1000.0
    return None


def _to_ppm(value: float, units: str) -> float | None:
    u = units.lower().replace("³", "3").replace("µ", "u")
    if "ppm" in u:
        return value
    if "ppb" in u:
        return value / 1000.0
    return None


def _normalize_concentration(name: str, value: float, units: str) -> float | None:
    if value < 0:
        return None
    u = units.lower()
    if name in ("pm25", "pm10"):
        if "g/m" in u or "ug/m" in u.replace("µ", "u"):
            return value
        return None
    if name in ("o3", "co"):
        return _to_ppm(value, units)
    if name in ("no2", "so2"):
        return _to_ppb(value, units)
    return None


def sub_index(concentration: float, breakpoints: list[Breakpoint]) -> int | None:
    for bp in breakpoints:
        if bp.c_low <= concentration <= bp.c_high:
            if bp.c_high == bp.c_low:
                return bp.i_high
            return round(
                (bp.i_high - bp.i_low) / (bp.c_high - bp.c_low) * (concentration - bp.c_low)
                + bp.i_low
            )
    if concentration > breakpoints[-1].c_high:
        return 500
    return None


def compute_aqi(readings: dict[str, tuple[float, str]]) -> tuple[int | None, str | None]:
    """
    readings: pollutant name -> (value, units)
    Returns overall AQI and dominant pollutant key (e.g. pm25).
    """
    best_aqi: int | None = None
    dominant: str | None = None

    for name, (value, units) in readings.items():
        bps = POLLUTANT_BREAKPOINTS.get(name)
        if not bps:
            continue
        conc = _normalize_concentration(name, value, units)
        if conc is None:
            continue
        idx = sub_index(conc, bps)
        if idx is None:
            continue
        if best_aqi is None or idx > best_aqi:
            best_aqi = idx
            dominant = name

    return best_aqi, dominant


def dominant_pollutant_label(key: str | None) -> str | None:
    if key is None:
        return None
    return DISPLAY_NAMES.get(key, key)
