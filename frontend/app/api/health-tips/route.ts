import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { city, aqi, predicted_aqi, dominant_pollutant } = body;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured in environment variables." },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({
      apiKey,
    });

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
      max_tokens: 300,
      system:
        "You are an air quality health advisor. Give concise, actionable health advice based on AQI data. Always include: 1) Who is most at risk, 2) Specific outdoor activity recommendations, 3) One protective measure. Keep response under 100 words.",
      messages: [
        {
          role: "user",
          content: `City: ${city}, Current AQI: ${aqi}, Tomorrow's forecast: ${predicted_aqi}, Main pollutant: ${dominant_pollutant}. Give health advice.`,
        },
      ],
    });

    const tips = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { type: "text"; text: string }).text)
      .join("\n\n");

    return NextResponse.json({ tips });
  } catch (error: any) {
    console.error("Error generating health tips with Claude:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate health tips." },
      { status: 500 }
    );
  }
}
