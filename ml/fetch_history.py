"""
Fetch historical AQI data from WAQI for all 8 BRICS cities.
Saves one CSV per city in ml/data/ folder.
"""

import os
import time
import requests
import pandas as pd
from datetime import datetime, timedelta

# Load token from backend .env
from dotenv import load_dotenv
load_dotenv("../backend/.env")

TOKEN = os.getenv("WAQI_API_KEY")
if not TOKEN:
    raise ValueError("WAQI_API_KEY not found in backend/.env")

CITIES = {
    "Delhi": "delhi",
    "Mumbai": "mumbai",
    "Beijing": "beijing",
    "Shanghai": "shanghai",
    "Moscow": "moscow",
    "Sao Paulo": "sao-paulo",
    "Cairo": "cairo",
    "Johannesburg": "johannesburg",
}

os.makedirs("data", exist_ok=True)


def fetch_city_history(city_name: str, slug: str) -> pd.DataFrame:
    """Fetch historical daily AQI for a city using WAQI history endpoint."""
    print(f"Fetching history for {city_name}...")

    # WAQI history endpoint
    url = f"https://api.waqi.info/feed/{slug}/?token={TOKEN}"
    response = requests.get(url, timeout=15)
    data = response.json()

    if data.get("status") != "ok":
        print(f"  ❌ Error for {city_name}: {data}")
        return pd.DataFrame()

    d = data["data"]

    # Get forecast data (WAQI provides past + future daily values)
    forecast = d.get("forecast", {}).get("daily", {})
    pm25_data = forecast.get("pm25", [])
    pm10_data = forecast.get("pm10", [])

    if not pm25_data and not pm10_data:
        print(f"  ⚠️ No forecast data for {city_name}")
        return pd.DataFrame()

    # Build DataFrame from pm25 daily forecast
    rows = []
    pm25_by_date = {entry["day"]: entry for entry in pm25_data}
    pm10_by_date = {entry["day"]: entry for entry in pm10_data}

    all_dates = sorted(set(list(pm25_by_date.keys()) + list(pm10_by_date.keys())))

    for date_str in all_dates:
        row = {"date": date_str, "city": city_name}
        if date_str in pm25_by_date:
            row["pm25_avg"] = pm25_by_date[date_str].get("avg")
            row["pm25_max"] = pm25_by_date[date_str].get("max")
            row["pm25_min"] = pm25_by_date[date_str].get("min")
        if date_str in pm10_by_date:
            row["pm10_avg"] = pm10_by_date[date_str].get("avg")
            row["pm10_max"] = pm10_by_date[date_str].get("max")
            row["pm10_min"] = pm10_by_date[date_str].get("min")

        # Use current AQI for today
        if date_str == datetime.now().strftime("%Y-%m-%d"):
            row["aqi"] = d.get("aqi")
        else:
            row["aqi"] = row.get("pm25_avg")  # use pm25 avg as AQI proxy

        rows.append(row)

    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)

    # Save to CSV
    path = f"data/{city_name.lower().replace(' ', '_')}_history.csv"
    df.to_csv(path, index=False)
    print(f"  ✅ Saved {len(df)} rows to {path}")
    return df


if __name__ == "__main__":
    all_data = []
    for city_name, slug in CITIES.items():
        df = fetch_city_history(city_name, slug)
        if not df.empty:
            all_data.append(df)
        time.sleep(1)  # be nice to the API

    # Save combined dataset
    if all_data:
        combined = pd.concat(all_data, ignore_index=True)
        combined.to_csv("data/all_cities_history.csv", index=False)
        print(f"\n✅ Combined dataset saved: {len(combined)} total rows")
        print(combined.groupby("city").size())
