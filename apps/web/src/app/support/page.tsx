import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Support — StatCheck",
  description:
    "Get help with StatCheck. Browse frequently asked questions or contact our support team.",
};

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-background-primary">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-text-primary mb-2">Support</h1>
        <p className="text-text-secondary mb-12">
          StatCheck helps you search player stats, track live scores, build
          custom lists, and compare players head-to-head. Below you'll find
          answers to the most common questions.
        </p>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <FaqItem
              question="How do I create an account?"
              answer="Tap 'Sign In' and create an account with your email or Apple ID. Your data syncs automatically across devices once you're signed in."
            />
            <FaqItem
              question="What are player lists?"
              answer="Lists let you group your favorite players together. Create a list, add players to it, and quickly check their latest stats all in one place."
            />
            <FaqItem
              question="What does StatCheck Pro include?"
              answer="Pro unlocks advanced stats (PER, true shooting %, usage rate, and more), unlimited lists, and an ad-free experience. You can subscribe monthly or yearly from the app."
            />
            <FaqItem
              question="How do I cancel my subscription?"
              answer="Subscriptions are managed through Apple. Go to Settings → Apple ID → Subscriptions on your device to manage or cancel."
            />
            <FaqItem
              question="Where does the data come from?"
              answer="Player stats and scores are sourced from balldontlie and other official data providers. We update stats as quickly as the sources make them available."
            />
            <FaqItem
              question="Can I use StatCheck on multiple devices?"
              answer="Yes. Sign in with the same account and your lists, preferences, and Pro subscription will sync across all your devices."
            />
            <FaqItem
              question="A stat looks wrong. What should I do?"
              answer="Stats come from third-party providers and occasionally have brief delays or discrepancies. If something looks persistently wrong, please contact us and we'll investigate."
            />
          </div>
        </section>

        {/* Contact */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            Contact Us
          </h2>
          <p className="text-text-secondary mb-4">
            Can't find what you're looking for? Reach out and we'll get back to
            you as soon as possible.
          </p>
          <a
            href="mailto:support@statcheckapp.com"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent-purple hover:bg-purple-500 rounded-xl font-semibold transition-colors"
          >
            Email Support
          </a>
          <p className="text-text-muted text-sm mt-3">
            support@statcheckapp.com
          </p>
        </section>

        {/* Legal links */}
        <section className="border-t border-white/5 pt-8">
          <div className="flex gap-6 text-sm text-text-secondary">
            <Link href="/privacy" className="hover:text-text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="bg-card rounded-xl p-5">
      <h3 className="font-semibold text-text-primary mb-2">{question}</h3>
      <p className="text-text-secondary text-sm leading-relaxed">{answer}</p>
    </div>
  );
}
