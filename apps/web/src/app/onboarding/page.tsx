import { redirect } from "next/navigation";

// Onboarding slides were removed; keep old links working
export default function OnboardingPage() {
  redirect("/");
}
