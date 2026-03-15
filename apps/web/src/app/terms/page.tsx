import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — StatCheck",
  description: "StatCheck terms of service. Read the terms governing use of our app and website.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background-primary">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-text-primary mb-2">Terms of Service</h1>
        <p className="text-text-muted text-sm mb-12">Effective date: March 15, 2026</p>

        <div className="space-y-10 text-text-secondary text-sm leading-relaxed">
          <Section title="1. Acceptance of Terms">
            <p>
              By accessing or using StatCheck ("the Service"), you agree to be bound by these
              Terms of Service. If you do not agree to these terms, do not use the Service.
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p>
              StatCheck provides sports statistics, live scores, player comparisons, and
              custom list features through a mobile application and website. Some features
              require a paid subscription (StatCheck Pro).
            </p>
          </Section>

          <Section title="3. Accounts">
            <p>
              You are responsible for maintaining the security of your account credentials. You
              must provide accurate information when creating an account. We reserve the right
              to suspend or terminate accounts that violate these terms.
            </p>
          </Section>

          <Section title="4. Acceptable Use">
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Use the Service for any unlawful purpose.</li>
              <li>Attempt to reverse-engineer, scrape, or extract data from the Service beyond normal use.</li>
              <li>Interfere with or disrupt the Service or its infrastructure.</li>
              <li>Create multiple accounts to circumvent restrictions or abuse features.</li>
              <li>Resell, redistribute, or commercially exploit the Service without authorization.</li>
            </ul>
          </Section>

          <Section title="5. Subscriptions and Payments">
            <p>
              StatCheck Pro subscriptions are billed through Apple's App Store. All payments
              are processed by Apple and are subject to Apple's terms. Subscriptions
              automatically renew unless cancelled at least 24 hours before the end of the
              current billing period. Refunds are handled by Apple in accordance with their
              refund policies.
            </p>
          </Section>

          <Section title="6. Intellectual Property">
            <p>
              The StatCheck name, logo, and all content created by us are our intellectual
              property. Player statistics and related data are sourced from third-party
              providers and remain the property of their respective owners. You may not copy,
              modify, or distribute our proprietary content without permission.
            </p>
          </Section>

          <Section title="7. Disclaimers">
            <p>
              The Service is provided "as is" and "as available" without warranties of any
              kind, either express or implied. We do not guarantee the accuracy, completeness,
              or timeliness of any statistics or scores displayed in the app. Sports data is
              sourced from third parties and may contain errors or delays.
            </p>
          </Section>

          <Section title="8. Limitation of Liability">
            <p>
              To the maximum extent permitted by law, StatCheck and its operators shall not be
              liable for any indirect, incidental, special, consequential, or punitive damages
              arising from your use of the Service. Our total liability for any claim related
              to the Service shall not exceed the amount you paid us in the 12 months
              preceding the claim.
            </p>
          </Section>

          <Section title="9. Account Termination">
            <p>
              We may suspend or terminate your access to the Service at any time if you
              violate these terms. You may delete your account at any time through the app
              settings. Upon termination, your right to use the Service ceases immediately.
            </p>
          </Section>

          <Section title="10. Changes to Terms">
            <p>
              We may modify these Terms of Service at any time. Material changes will be
              communicated by posting the updated terms on this page and updating the
              effective date. Continued use of the Service after changes constitutes acceptance
              of the new terms.
            </p>
          </Section>

          <Section title="11. Governing Law">
            <p>
              These terms shall be governed by and construed in accordance with the laws of
              the United States, without regard to conflict of law provisions.
            </p>
          </Section>

          <Section title="12. Contact Us">
            <p>
              If you have any questions about these Terms of Service, contact us at{" "}
              <a
                href="mailto:support@statcheckapp.com"
                className="text-accent-purple hover:underline"
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
          <Link href="/privacy" className="hover:text-text-primary transition-colors">
            Privacy Policy
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
