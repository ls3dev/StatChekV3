"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setOnboardingComplete } from "@/utils/storage";

const SLIDES = [
  {
    id: "welcome",
    title: "Welcome to StatCheck",
    description:
      "Your personal sports player ranking companion. Build lists, compare stats, and settle debates.",
    icon: "trophy",
    gradient: ["#7C3AED", "#5B21B6"],
  },
  {
    id: "search",
    title: "Find Any Player",
    description:
      "Search across NBA, NFL, MLB, and NHL. Get instant access to stats, career highlights, and more.",
    icon: "search",
    gradient: ["#3B82F6", "#1D4ED8"],
  },
  {
    id: "lists",
    title: "Create Your Rankings",
    description:
      "Build custom lists, drag to rank players, and share your takes with friends.",
    icon: "list",
    gradient: ["#10B981", "#047857"],
  },
];

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m-.014-.002a5.25 5.25 0 0 0 3.072 0m-3.072 0a5.249 5.249 0 0 1-2.62-.975M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728m2.48-5.492V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492V2.721M16.27 9.728a6.726 6.726 0 0 1-2.748 1.35"
      />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
      />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
      />
    </svg>
  );
}

function SlideIcon({ icon, className }: { icon: string; className?: string }) {
  switch (icon) {
    case "trophy":
      return <TrophyIcon className={className} />;
    case "search":
      return <SearchIcon className={className} />;
    case "list":
      return <ListIcon className={className} />;
    default:
      return null;
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentSlide = SLIDES[currentIndex];
  const isLastSlide = currentIndex === SLIDES.length - 1;

  const handleComplete = useCallback(() => {
    setOnboardingComplete();
    router.replace("/");
  }, [router]);

  const handleNext = useCallback(() => {
    if (isLastSlide) {
      handleComplete();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [isLastSlide, handleComplete]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        handleNext();
      } else if (e.key === "ArrowLeft" && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      } else if (e.key === "Escape") {
        handleSkip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handleSkip, currentIndex]);

  return (
    <div className="min-h-screen bg-background-primary flex flex-col">
      {/* Background gradient */}
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{
          background: `linear-gradient(135deg, ${currentSlide.gradient[0]}15, ${currentSlide.gradient[1]}05)`,
        }}
      />

      {/* Skip button */}
      <div className="relative z-10 flex justify-end p-6">
        <button
          onClick={handleSkip}
          className="text-text-secondary hover:text-text-primary transition-colors text-sm font-medium"
        >
          Skip
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        {/* Icon */}
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8 transition-all duration-500"
          style={{
            background: `linear-gradient(135deg, ${currentSlide.gradient[0]}, ${currentSlide.gradient[1]})`,
            boxShadow: `0 20px 40px ${currentSlide.gradient[0]}40`,
          }}
        >
          <SlideIcon icon={currentSlide.icon} className="w-12 h-12 text-white" />
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary text-center mb-4">
          {currentSlide.title}
        </h1>

        {/* Description */}
        <p className="text-text-secondary text-center max-w-md text-lg">
          {currentSlide.description}
        </p>
      </div>

      {/* Bottom section */}
      <div className="relative z-10 px-6 pb-12">
        {/* Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {SLIDES.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "w-8 bg-accent-purple"
                  : "bg-white/20 hover:bg-white/40"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Continue button */}
        <button
          onClick={handleNext}
          className="w-full max-w-sm mx-auto block py-4 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-[1.02]"
          style={{
            background: `linear-gradient(135deg, ${currentSlide.gradient[0]}, ${currentSlide.gradient[1]})`,
            boxShadow: `0 10px 30px ${currentSlide.gradient[0]}40`,
          }}
        >
          {isLastSlide ? "Get Started" : "Continue"}
        </button>
      </div>
    </div>
  );
}
