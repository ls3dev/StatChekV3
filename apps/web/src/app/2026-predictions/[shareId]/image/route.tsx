import { ImageResponse } from "next/og";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { PredictionsImage, PREDICTIONS_IMAGE_SIZE } from "@/lib/predictionsImage";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params;

  let predictions = null;
  try {
    predictions = await fetchQuery(
      api.predictions.getPredictionsByShareId,
      { shareId },
      { url: convexUrl }
    );
  } catch (error) {
    console.error("[PredictionsImage] Failed to fetch predictions:", error);
  }

  if (!predictions) {
    return new Response("Predictions not found", { status: 404 });
  }

  return new ImageResponse(<PredictionsImage data={predictions} />, {
    ...PREDICTIONS_IMAGE_SIZE,
    headers: {
      // Picks can change, so keep caches short
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}
