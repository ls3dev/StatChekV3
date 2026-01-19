import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-background-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-3xl font-bold bg-gradient-to-r from-accent-purple to-purple-400 bg-clip-text text-transparent"
          >
            StatCheck
          </Link>
        </div>

        {/* Clerk SignUp Component */}
        <div className="flex justify-center">
          <SignUp
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-card rounded-2xl shadow-none border border-white/10",
                headerTitle: "text-text-primary",
                headerSubtitle: "text-text-secondary",
                formFieldLabel: "text-text-secondary",
                formFieldInput:
                  "bg-background-primary border-white/10 text-text-primary placeholder-text-muted focus:border-accent-purple",
                formButtonPrimary:
                  "bg-accent-purple hover:bg-purple-500 text-white",
                footerActionLink: "text-accent-purple hover:text-purple-400",
                dividerLine: "bg-white/10",
                dividerText: "text-text-muted",
                socialButtonsBlockButton:
                  "bg-background-primary border-white/10 text-text-primary hover:bg-white/5",
              },
            }}
            signInUrl="/auth/signin"
            fallbackRedirectUrl="/"
          />
        </div>

        {/* Back to Home */}
        <p className="text-center mt-6">
          <Link
            href="/"
            className="text-text-muted hover:text-text-secondary transition-colors"
          >
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
