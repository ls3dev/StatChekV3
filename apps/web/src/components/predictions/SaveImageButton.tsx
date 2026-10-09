"use client";

import { useState } from "react";
import { PREDICTIONS_PATH, PREDICTIONS_SEASON } from "@convex/lib/predictions";

type SaveImageButtonProps = {
  shareId: string;
  // Busts caches so the image reflects the latest saved picks
  version: number;
  className?: string;
};

export function SaveImageButton({ shareId, version, className }: SaveImageButtonProps) {
  const [isWorking, setIsWorking] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleClick = async () => {
    setIsWorking(true);
    setFailed(false);
    try {
      const response = await fetch(`${PREDICTIONS_PATH}/${shareId}/image?v=${version}`);
      if (!response.ok) throw new Error(`Image request failed: ${response.status}`);
      const blob = await response.blob();
      const fileName = `statcheck-${PREDICTIONS_SEASON}-predictions.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      // Phones: open the share sheet (Save Image, Messages, Instagram, ...)
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
        } catch (shareError) {
          if ((shareError as Error).name !== "AbortError") throw shareError;
        }
        return;
      }

      // Desktop: download the file
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Saving predictions image failed", error);
      setFailed(true);
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isWorking}
      className={
        className ??
        "rounded-lg bg-background-secondary px-4 py-2 text-sm font-semibold text-text-primary hover:bg-white/10 disabled:opacity-60 transition-colors"
      }
    >
      {isWorking ? "Creating Image..." : failed ? "Try Again" : "Save Image"}
    </button>
  );
}
