import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { PREDICTIONS_PATH, formatSeasonLabel } from "@convex/lib/predictions";
import { PREDICTIONS_IMAGE_SIZE } from "@/lib/predictionsImage";
import { SharedPredictionsView } from "@/components/predictions/SharedPredictionsView";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.statcheckapp.com";
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

interface Props {
  params: Promise<{ shareId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shareId } = await params;

  let predictions = null;
  try {
    predictions = await fetchQuery(
      api.predictions.getPredictionsByShareId,
      { shareId },
      { url: convexUrl }
    );
  } catch (error) {
    console.error("[SharedPredictions] Failed to fetch predictions:", error);
  }

  if (!predictions) {
    return { title: "Predictions Not Found | StatCheck" };
  }

  const seasonLabel = formatSeasonLabel(predictions.season);
  const title = predictions.displayName
    ? `${seasonLabel} NBA Predictions by @${predictions.displayName}`
    : `${seasonLabel} NBA Predictions`;
  const mvp = predictions.picks.find((p) => p.category === "mvp");
  const description = mvp
    ? `MVP: ${mvp.name}. See their awards, All-NBA teams, and seeding picks on StatCheck.`
    : "See their awards, All-NBA teams, and seeding picks on StatCheck.";
  const image = {
    url: `${baseUrl}${PREDICTIONS_PATH}/${shareId}/image?v=${predictions.updatedAt}`,
    ...PREDICTIONS_IMAGE_SIZE,
    alt: title,
  };

  return {
    title: `${title} | StatCheck`,
    description,
    metadataBase: new URL(baseUrl),
    openGraph: {
      title,
      description,
      type: "website",
      url: `${baseUrl}${PREDICTIONS_PATH}/${shareId}`,
      siteName: "StatCheck",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
    },
  };
}

export default async function SharedPredictionsPage({ params }: Props) {
  const { shareId } = await params;
  return <SharedPredictionsView shareId={shareId} />;
}
