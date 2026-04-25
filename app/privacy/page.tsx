"use client";

import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

export default function PrivacyPage() {
  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden">
      <header className="z-40 flex items-center justify-between border-b border-border/20 bg-background/90 px-4 py-3 backdrop-blur-md">
        <h1 className="font-display text-2xl text-white">Privacy Policy</h1>
        <Link href="/" className="text-xs text-accent-glow hover:underline">Back</Link>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-20 pt-4">
        <div className="mx-auto max-w-lg space-y-6 text-sm text-text-secondary leading-relaxed">
          <p className="text-xs text-text-muted">Last updated: April 2026</p>

          <section>
            <h2 className="font-display text-lg text-accent-glow mb-2">1. Information We Collect</h2>
            <p><strong className="text-text-primary">Account data:</strong> email address (via Google, Apple, or email login through Privy).</p>
            <p><strong className="text-text-primary">Wallet addresses:</strong> Solana and/or XRP addresses you connect for deposits.</p>
            <p><strong className="text-text-primary">Activity data:</strong> predictions placed, amounts, results, and timestamps.</p>
            <p><strong className="text-text-primary">Device data:</strong> browser type, push notification subscriptions.</p>
          </section>

          <section>
            <h2 className="font-display text-lg text-accent-glow mb-2">2. How We Use Your Data</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Operate your account and process predictions</li>
              <li>Credit deposits and process withdrawals</li>
              <li>Send notifications about prediction results</li>
              <li>Generate leaderboard rankings</li>
              <li>Prevent fraud and abuse</li>
              <li>Improve the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg text-accent-glow mb-2">3. Data Sharing</h2>
            <p>We do not sell your personal data. We share data only with:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-text-primary">Privy:</strong> authentication provider</li>
              <li><strong className="text-text-primary">Supabase:</strong> database hosting</li>
              <li><strong className="text-text-primary">Vercel:</strong> application hosting</li>
              <li><strong className="text-text-primary">CoinGecko:</strong> price data (no user data shared)</li>
            </ul>
            <p className="mt-2">Your username and prediction history are visible on the public leaderboard.</p>
          </section>

          <section>
            <h2 className="font-display text-lg text-accent-glow mb-2">4. Data Security</h2>
            <p>We use encryption in transit (HTTPS), secure authentication (Privy), and access controls on our database. Wallet private keys are never stored on our servers.</p>
          </section>

          <section>
            <h2 className="font-display text-lg text-accent-glow mb-2">5. Data Retention</h2>
            <p>Account data is retained while your account is active. You can request account deletion through the Settings page or by contacting us. Transaction history may be retained for legal compliance.</p>
          </section>

          <section>
            <h2 className="font-display text-lg text-accent-glow mb-2">6. Cookies</h2>
            <p>We use essential cookies for authentication and session management. No third-party tracking cookies are used.</p>
          </section>

          <section>
            <h2 className="font-display text-lg text-accent-glow mb-2">7. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data. Contact us at <a href="mailto:hello@nostradameme.com" className="text-accent-glow underline">hello@nostradameme.com</a> to exercise these rights.</p>
          </section>

          <section>
            <h2 className="font-display text-lg text-accent-glow mb-2">8. Changes</h2>
            <p>We may update this policy at any time. We will notify you of significant changes via email or in-app notification.</p>
          </section>

          <section>
            <h2 className="font-display text-lg text-accent-glow mb-2">9. Contact</h2>
            <p>For privacy-related questions: <a href="mailto:hello@nostradameme.com" className="text-accent-glow underline">hello@nostradameme.com</a></p>
          </section>
        </div>
      </main>

      <BottomNav active="profile" />
    </div>
  );
}
