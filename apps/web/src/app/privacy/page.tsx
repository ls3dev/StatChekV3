import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — StatCheck",
  description: "StatCheck privacy policy. Learn how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background-primary">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-text-primary mb-2">Privacy Policy</h1>
        <p className="text-text-muted text-sm mb-12">Effective date: March 15, 2026</p>

        <div className="space-y-10 text-text-secondary text-sm leading-relaxed">
          <Section title="1. Introduction">
            <p>
              StatCheck ("we", "our", or "us") operates the StatCheck mobile application and
              website at statcheckapp.com. This Privacy Policy explains how we collect, use,
              and share information when you use our services.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <p className="mb-3">We collect the following types of information:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-text-primary">Account information</strong> — email
                address and display name when you create an account.
              </li>
              <li>
                <strong className="text-text-primary">Usage data</strong> — pages visited,
                features used, search queries, and interactions within the app.
              </li>
              <li>
                <strong className="text-text-primary">Device information</strong> — device
                type, operating system, and app version.
              </li>
              <li>
                <strong className="text-text-primary">Purchase information</strong> —
                subscription status and transaction identifiers (payment details are handled
                entirely by Apple and are never stored by us).
              </li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Information">
            <ul className="list-disc pl-5 space-y-2">
              <li>Provide, maintain, and improve the StatCheck service.</li>
              <li>Sync your lists, preferences, and subscription status across devices.</li>
              <li>Analyze usage patterns to improve features and fix issues.</li>
              <li>Communicate with you about your account or support requests.</li>
            </ul>
          </Section>

          <Section title="4. Third-Party Services">
            <p className="mb-3">We use the following third-party services:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-text-primary">Clerk</strong> — authentication and
                user management.
              </li>
              <li>
                <strong className="text-text-primary">Convex</strong> — backend database and
                real-time data sync.
              </li>
              <li>
                <strong className="text-text-primary">RevenueCat</strong> — subscription and
                in-app purchase management.
              </li>
              <li>
                <strong className="text-text-primary">PostHog</strong> — product analytics
                and usage tracking.
              </li>
            </ul>
            <p className="mt-3">
              Each of these services has its own privacy policy governing how they handle your
              data. We encourage you to review their policies.
            </p>
          </Section>

          <Section title="5. Data Sharing">
            <p>
              We do not sell your personal information. We share data only with the
              third-party services listed above as necessary to operate StatCheck, or when
              required by law.
            </p>
          </Section>

          <Section title="6. Data Retention">
            <p>
              We retain your account data for as long as your account is active. If you delete
              your account, we will remove your personal data within 30 days, except where
              retention is required by law.
            </p>
          </Section>

          <Section title="7. Your Rights">
            <p>You may:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Request access to the personal data we hold about you.</li>
              <li>Request correction or deletion of your data.</li>
              <li>Opt out of analytics tracking by contacting us.</li>
            </ul>
          </Section>

          <Section title="8. Security">
            <p>
              We implement industry-standard security measures to protect your data. However,
              no method of electronic storage is 100% secure and we cannot guarantee absolute
              security.
            </p>
          </Section>

          <Section title="9. Children's Privacy">
            <p>
              StatCheck is not directed at children under 13. We do not knowingly collect
              personal information from children under 13. If you believe we have collected
              such information, please contact us so we can promptly remove it.
            </p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of
              material changes by posting the new policy on this page and updating the
              effective date.
            </p>
          </Section>

          <Section title="11. Contact Us">
            <p>
              If you have any questions about this Privacy Policy, contact us at{" "}
              <a
                href="mailto:support@statcheckapp.com"
                className="text-accent hover:underline"
              >
                support@statcheckapp.com
              </a>
              .
            </p>
          </Section>
        </div>

        <div className="border-t border-white/5 mt-12 pt-8 flex gap-6 text-sm text-text-secondary">
          <Link href="/support" className="hover:text-text-primary transition-colors">
            Support
          </Link>
          <Link href="/terms" className="hover:text-text-primary transition-colors">
            Terms of Service
          </Link>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-text-primary mb-3">{title}</h2>
      {children}
    </section>
  );
}
