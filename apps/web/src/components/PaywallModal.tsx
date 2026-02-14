"use client";

import { useEffect } from "react";

type PaywallModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const PRO_FEATURES = [
  { text: "Unlimited player lists" },
  { text: "Cloud sync across devices" },
  { text: "Share lists with friends" },
  { text: "Advanced player stats" },
];

export function PaywallModal({ isOpen, onClose }: PaywallModalProps) {
  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-background-secondary rounded-2xl shadow-2xl text-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
        >
          <svg
            className="w-5 h-5 text-text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="px-6 pt-8 pb-6">
          {/* Lock icon */}
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-text-primary mb-2">
            List Limit Reached
          </h2>

          {/* Description */}
          <p className="text-text-secondary text-sm mb-6">
            Free accounts can create 1 list. Upgrade to Pro for unlimited lists
            and more features!
          </p>

          {/* Features */}
          <div className="text-left space-y-3 mb-6">
            {PRO_FEATURES.map((feature) => (
              <div key={feature.text} className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-green-400 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-text-primary text-sm">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Upgrade button — links to mobile app */}
          <a
            href="https://apps.apple.com/app/statcheck-player-rankings/id6743597908"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white font-semibold rounded-xl transition-all text-center"
          >
            <span className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M11.624 7.222c-.876 0-2.232-.996-3.66-.984-1.884.024-3.612 1.092-4.584 2.784-1.956 3.396-.504 8.412 1.404 11.172.936 1.344 2.04 2.856 3.504 2.808 1.404-.06 1.932-.912 3.636-.912 1.692 0 2.172.912 3.66.876 1.512-.024 2.472-1.368 3.396-2.724 1.068-1.56 1.512-3.072 1.536-3.156-.036-.012-2.94-1.128-2.976-4.488-.024-2.808 2.292-4.152 2.4-4.212-1.308-1.932-3.348-2.148-4.08-2.196-1.848-.144-3.396 1.008-4.236 1.008zm3.12-2.832c.78-.936 1.296-2.244 1.152-3.54-1.116.048-2.46.744-3.264 1.68-.72.828-1.344 2.16-1.176 3.432 1.236.096 2.508-.636 3.288-1.572z" />
              </svg>
              Upgrade on iOS App
            </span>
          </a>

          {/* Maybe later */}
          <button
            onClick={onClose}
            className="mt-3 py-2 text-text-muted text-sm hover:text-text-secondary transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
