"use client";

import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

export default function TermsPage() {
  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden">
      <header className="z-40 flex items-center justify-between border-b border-border/20 bg-background/90 px-4 py-3 backdrop-blur-md">
        <h1 className="font-display text-2xl text-white">Terms of Service</h1>
        <Link href="/" className="text-xs text-accent-glow hover:underline">Back</Link>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-20 pt-4">
        <div className="mx-auto max-w-lg space-y-6 text-sm text-text-secondary leading-relaxed">
          <p className="text-xs text-text-muted">Last updated: April 2026</p>

          <section>
            <h2 className="font-display text-lg text-accent-glow mb-2">1. Acceptance</h2>
            <p>By using Nostradameme ("the Service"), you agree to these Terms of Service. If you do not agree, do not use the Service.</p>
          </section>

          <section>
            <h2 className="font-display text-lg text-accent-glow mb-2">2. Description</h2>
            <p>Nostradameme is a prediction game where users bet on the future price of crypto assets. It is entertainment only and does not constitute financial advice, investment advice, or gambling services.</p>
          </section>

          <section>
            <h2 className="font-display text-lg text-accent-glow mb-2">3. Eligibility</h2>
            <p>You must be at least 18 years old (or the age of majority in your jurisdiction) to use the Service. You are responsible for ensuring that your use complies with local laws.</p>
          </section>

          <section>
            <h2 className="font-display text-lg text-accent-glow mb-2">4. Accounts</h2>
            <p>You are responsible for maintaining the security of your account. You must not share your credentials or allow others to access your account. We reserve the right to suspend or terminate accounts at our discretion.</p>
          </section>

          <section>
            <h2 className="font-display text-lg text-accent-glow mb-2">5. Deposits &amp; Withdrawals</h2>
            <p>Deposits are made via SOL or XRP. All deposits are converted to an internal balance in USD equivalent. Withdrawals are subject to verification and processing time. We are not responsible for losses due to blockchain network issues or wallet errors.</p>
          </section>

          <section>
            <h2 className="font-display text-lg text-accent-glow mb-2">6. Predictions &amp; Payouts</h2>
            <p>Predictions are resolved based on publicly available crypto price data. A 5% platform fee is deducted from the winning pool. Results are final once the oracle has spoken. We reserve the right to cancel a prediction and refund all bets if data integrity issues occur.</p>
          </section>

          <section>
            <h2 className="font-display text-lg text-accent-glow mb-2">7. Prohibited Conduct</h2>
            <p>You agree not to: manipulate markets, use bots or automated systems, create multiple accounts, exploit bugs or vulnerabilities, or engage in any fraudulent activity.</p>
          </section>

          <section>
            <h2 className="font-display text-lg text-accent-glow mb-2">8. Limitation of Liability</h2>
            <p>The Service is provided "as is" without warranties. We are not liable for any losses, including loss of funds, arising from your use of the Service. You use the Service at your own risk.</p>
          </section>

          <section>
            <h2 className="font-display text-lg text-accent-glow mb-2">9. Changes</h2>
            <p>We may update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.</p>
          </section>

          <section>
            <h2 className="font-display text-lg text-accent-glow mb-2">10. Contact</h2>
            <p>For questions about these Terms, contact us at <a href="mailto:hello@nostradameme.com" className="text-accent-glow underline">hello@nostradameme.com</a>.</p>
          </section>
        </div>
      </main>

      <BottomNav active="profile" />
    </div>
  );
}
