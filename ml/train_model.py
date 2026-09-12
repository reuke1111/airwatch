"""
Train XGBoost model to forecast AQI for each city.
Generates SHAP explanations and saves models to ml/models/
"""

import os
import pickle
import warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
import shap
import xgboost as xgb
from sklearn.metrics import mean_absolute_error
import matplotlib
matplotlib.use("Agg")  # non-interactive backend
import matplotlib.pyplot as plt

os.makedirs("models", exist_ok=True)
os.makedirs("shap_plots", exist_ok=True)

# ── Load data ──────────────────────────────────────────────────────────────
df = pd.read_csv("data/all_cities_history.csv", parse_dates=["date"])
df = df.sort_values(["city", "date"]).reset_index(drop=True)

# Fill missing values
for col in ["pm25_avg", "pm25_max", "pm25_min", "pm10_avg", "pm10_max", "pm10_min", "aqi"]:
    if col in df.columns:
        df[col] = pd.to_numeric(df[col], errors="coerce")

df["aqi"] = df["aqi"].fillna(df["pm25_avg"]).fillna(df["pm10_avg"])
df = df.dropna(subset=["aqi"])


def make_features(city_df: pd.DataFrame) -> pd.DataFrame:
    """Engineer lag and time features from daily AQI."""
    d = city_df.copy().sort_values("date").reset_index(drop=True)
    d["aqi_lag1"] = d["aqi"].shift(1)
    d["aqi_lag2"] = d["aqi"].shift(2)
    d["aqi_lag3"] = d["aqi"].shift(3)
    d["aqi_rolling3"] = d["aqi"].shift(1).rolling(3).mean()
    d["pm25_lag1"] = d["pm25_avg"].shift(1) if "pm25_avg" in d else np.nan
    d["pm10_lag1"] = d["pm10_avg"].shift(1) if "pm10_avg" in d else np.nan
    d["day_of_week"] = d["date"].dt.dayofweek
    d["month"] = d["date"].dt.month
    d["target"] = d["aqi"]  # predict today's AQI from yesterday's features
    return d.dropna(subset=["aqi_lag1", "target"])


FEATURE_COLS = [
    "aqi_lag1", "aqi_lag2", "aqi_lag3", "aqi_rolling3",
    "pm25_lag1", "pm10_lag1", "day_of_week", "month"
]

cities = df["city"].unique()
all_results = []

print("Training XGBoost models...\n")

for city in cities:
    city_df = df[df["city"] == city].copy()
    feat_df = make_features(city_df)

    if len(feat_df) < 4:
        print(f"⚠️  {city}: not enough rows ({len(feat_df)}), skipping")
        continue

    # Use available feature columns only
    available_features = [f for f in FEATURE_COLS if f in feat_df.columns and feat_df[f].notna().any()]
    feat_df = feat_df.dropna(subset=available_features)

    X = feat_df[available_features]
    y = feat_df["target"]

    # Train/test split (last row = test)
    X_train, X_test = X.iloc[:-1], X.iloc[[-1]]
    y_train, y_test = y.iloc[:-1], y.iloc[[-1]]

    if len(X_train) < 2:
        X_train, y_train = X, y
        X_test, y_test = X.iloc[[-1]], y.iloc[[-1]]

    # Train model
    model = xgb.XGBRegressor(
        n_estimators=100,
        max_depth=3,
        learning_rate=0.1,
        random_state=42,
        verbosity=0,
    )
    model.fit(X_train, y_train)

    # Predict next day AQI
    latest_features = X.iloc[[-1]]
    predicted_aqi = float(model.predict(latest_features)[0])
    predicted_aqi = max(0, round(predicted_aqi))

    # MAE on test
    mae = mean_absolute_error(y_test, model.predict(X_test))

    print(f"✅ {city}")
    print(f"   Current AQI : {int(y.iloc[-1])}")
    print(f"   Predicted   : {predicted_aqi}  (MAE: {mae:.1f})")

    # SHAP explanation
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(latest_features)

    # SHAP waterfall plot
    plt.figure(figsize=(8, 4))
    shap.bar_plot(shap_values[0], feature_names=available_features, show=False)
    plt.title(f"{city} — SHAP Feature Importance (Next 24hr AQI Forecast)")
    plt.tight_layout()
    plot_path = f"shap_plots/{city.lower().replace(' ', '_')}_shap.png"
    plt.savefig(plot_path, dpi=100, bbox_inches="tight")
    plt.close()

    # Save model + metadata
    model_data = {
        "model": model,
        "features": available_features,
        "latest_aqi": int(y.iloc[-1]),
        "predicted_aqi": predicted_aqi,
        "mae": round(mae, 1),
        "shap_values": shap_values[0].tolist(),
        "shap_features": available_features,
        "city": city,
    }
    model_path = f"models/{city.lower().replace(' ', '_')}_model.pkl"
    with open(model_path, "wb") as f:
        pickle.dump(model_data, f)

    all_results.append({
        "city": city,
        "current_aqi": int(y.iloc[-1]),
        "predicted_aqi": predicted_aqi,
        "mae": round(mae, 1),
    })

# Summary
print("\n" + "="*50)
print("FORECAST SUMMARY")
print("="*50)
results_df = pd.DataFrame(all_results)
print(results_df.to_string(index=False))
print(f"\nModels saved to ml/models/")
print(f"SHAP plots saved to ml/shap_plots/")
