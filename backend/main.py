import os
import pickle
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from openaq_client import CityAqiResult, OpenAQClient

load_dotenv()
OPENAQ_API_KEY = os.getenv("WAQI_API_KEY", os.getenv("OPENAQ_API_KEY", "")).strip()
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173",
).split(",")


class AqiCityResponse(BaseModel):
    city: str
    aqi: int | None
    dominant_pollutant: str | None
    timestamp: str | None = Field(
        None, description="UTC timestamp of the latest measurement used"
    )
    error: str | None = None


class AqiListResponse(BaseModel):
    cities: list[AqiCityResponse]


class ForecastResponse(BaseModel):
    city: str
    current_aqi: int
    predicted_aqi: int
    mae: float
    shap_features: list[str]
    shap_values: list[float]
    recommendation: str


def _to_response(result: CityAqiResult) -> AqiCityResponse:
    return AqiCityResponse(
        city=result.city,
        aqi=result.aqi,
        dominant_pollutant=result.dominant_pollutant,
        timestamp=result.timestamp,
        error=result.error,
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not OPENAQ_API_KEY or OPENAQ_API_KEY == "your_openaq_api_key_here":
        app.state.openaq = None
    else:
        app.state.openaq = OpenAQClient(OPENAQ_API_KEY)
    yield


app = FastAPI(title="AirWatch API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in CORS_ORIGINS if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/aqi", response_model=AqiListResponse)
async def get_aqi() -> AqiListResponse:
    client: OpenAQClient | None = app.state.openaq
    if client is None:
        raise HTTPException(
            status_code=503,
            detail="OPENAQ_API_KEY is not configured. Set it in backend/.env",
        )
    results = await client.fetch_all_cities()
    return AqiListResponse(cities=[_to_response(r) for r in results])


CITY_SLUG_MAP: dict[str, str] = {
    "delhi": "delhi",
    "mumbai": "mumbai",
    "beijing": "beijing",
    "shanghai": "shanghai",
    "moscow": "moscow",
    "são paulo": "sao_paulo",
    "cairo": "cairo",
    "johannesburg": "johannesburg",
}


def _get_recommendation(predicted_aqi: int) -> str:
    if predicted_aqi <= 50:
        return "Air quality is Good. Safe for outdoor activities."
    elif predicted_aqi <= 100:
        return "Air quality is Moderate. Sensitive groups should limit outdoor exposure."
    elif predicted_aqi <= 150:
        return "Air quality is Unhealthy for Sensitive Groups. Wear a mask outdoors."
    return "Air quality is Unhealthy. Avoid prolonged outdoor activities."


@app.get("/api/forecast/{city}", response_model=ForecastResponse)
async def get_forecast(city: str) -> ForecastResponse:
    normalized_city = city.strip().lower()
    city_slug = CITY_SLUG_MAP.get(normalized_city)
    if not city_slug:
        raise HTTPException(status_code=404, detail=f"City '{city}' not found")

    candidate_paths = [
        Path(f"../ml/models/{city_slug}_model.pkl"),
        Path(__file__).resolve().parent.parent / "ml" / "models" / f"{city_slug}_model.pkl",
        Path("ml/models") / f"{city_slug}_model.pkl",
    ]

    model_path = next((p for p in candidate_paths if p.is_file()), None)
    if not model_path:
        raise HTTPException(
            status_code=404,
            detail=f"Forecast model not found for city '{city}'",
        )

    try:
        with open(model_path, "rb") as f:
            model_data = pickle.load(f)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load forecast model: {exc}",
        )

    predicted_aqi = int(model_data["predicted_aqi"])
    current_aqi = int(model_data.get("latest_aqi", model_data.get("current_aqi", 0)))
    city_name = model_data.get("city", city)

    return ForecastResponse(
        city=city_name,
        current_aqi=current_aqi,
        predicted_aqi=predicted_aqi,
        mae=float(model_data["mae"]),
        shap_features=[str(feat) for feat in model_data.get("shap_features", [])],
        shap_values=[float(val) for val in model_data.get("shap_values", [])],
        recommendation=_get_recommendation(predicted_aqi),
    )
