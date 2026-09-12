import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { city, aqi, predicted_aqi, dominant_pollutant } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in environment variables." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel(
      {
        model: "gemini-3.6-flash",
        systemInstruction:
          "You are an air quality health advisor. Give concise, actionable health advice based on AQI data. Always include: 1) Who is most at risk, 2) Specific outdoor activity recommendations, 3) One protective measure. Keep response under 100 words.",
      },
      { apiVersion: "v1beta" }
    );

    const userPrompt = `City: ${city}, Current AQI: ${aqi}, Tomorrow's forecast: ${predicted_aqi}, Main pollutant: ${dominant_pollutant}. Give health advice.`;

    const result = await model.generateContent(userPrompt);
    const response = await result.response;
    const tips = response.text();

    return NextResponse.json({ tips });
  } catch (error: any) {
    console.error("Error generating health tips with Gemini:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate health tips." },
      { status: 500 }
    );
  }
}
