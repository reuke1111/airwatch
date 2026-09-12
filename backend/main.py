import os
from contextlib import asynccontextmanager

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
