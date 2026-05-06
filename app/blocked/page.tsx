"use client";

import Link from "next/link";

export default function BlockedPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <div className="mx-auto max-w-md space-y-6">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-surface border border-border/40">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-12 w-12 text-no-glow">
            <circle cx="12" cy="12" r="10" />
            <path d="M4.93 4.93l14.14 14.14" />
          </svg>
        </div>

        <h1 className="font-display text-3xl text-text-primary">
          Not available in your region
        </h1>

        <p className="text-sm text-text-secondary leading-relaxed">
          Nostradameme is a crypto prediction game that involves real funds.
          Due to local regulations regarding online betting and cryptocurrency
          in your country, we are unable to provide access to our services
          in your region at this time.
        </p>

        <p className="text-sm text-text-secondary leading-relaxed">
          We respect the laws of every jurisdiction and are committed to
          operating responsibly. If you believe your country has been
          blocked in error, please contact us.
        </p>

        <div className="space-y-3 pt-4">
          <a
            href="mailto:hello@nostradameme.com"
            className="block rounded-xl border border-accent/30 bg-surface/60 px-4 py-3 text-sm text-accent-glow transition-all hover:border-accent/60"
          >
            Contact us: hello@nostradameme.com
          </a>
          <div className="flex justify-center gap-4 text-xs text-text-muted">
            <Link href="/terms" className="hover:text-accent-glow">Terms</Link>
            <Link href="/privacy" className="hover:text-accent-glow">Privacy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
