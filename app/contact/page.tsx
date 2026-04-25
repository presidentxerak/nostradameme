"use client";

import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

export default function ContactPage() {
  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden">
      <header className="z-40 flex items-center justify-between border-b border-border/20 bg-background/90 px-4 py-3 backdrop-blur-md">
        <h1 className="font-display text-2xl text-white">Contact</h1>
        <Link href="/" className="text-xs text-accent-glow hover:underline">Back</Link>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-20 pt-4">
        <div className="mx-auto max-w-lg space-y-8 pt-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/20">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10 text-accent-glow">
                <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 6.093L2.25 6.75" />
              </svg>
            </div>
            <h2 className="font-display text-xl text-text-primary">Get in touch</h2>
            <p className="text-sm text-text-secondary max-w-xs">
              Have a question, found a bug, or want to partner with us? We would love to hear from you.
            </p>
          </div>

          <div className="space-y-3">
            <a
              href="mailto:hello@nostradameme.com"
              className="flex items-center gap-4 rounded-xl border border-accent/30 bg-surface/60 px-4 py-4 transition-all hover:border-accent/60 hover:bg-surface"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-accent-glow">
                  <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 6.093L2.25 6.75" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-sans text-sm font-bold text-text-primary">Email</p>
                <p className="text-xs text-text-muted">hello@nostradameme.com</p>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-text-muted">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </a>

            <a
              href="https://x.com/nostradameme"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-xl border border-border/40 bg-surface/40 px-4 py-4 transition-all hover:border-accent/40 hover:bg-surface/60"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-xl font-bold text-text-secondary">
                X
              </div>
              <div className="flex-1">
                <p className="font-sans text-sm font-bold text-text-primary">X (Twitter)</p>
                <p className="text-xs text-text-muted">@nostradameme</p>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-text-muted">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </a>
          </div>

          <div className="text-center space-y-2 pt-4">
            <p className="text-xs text-text-muted">
              See also:
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/terms" className="text-xs text-accent-glow hover:underline">Terms of Service</Link>
              <Link href="/privacy" className="text-xs text-accent-glow hover:underline">Privacy Policy</Link>
              <Link href="/rules" className="text-xs text-accent-glow hover:underline">Rules</Link>
            </div>
          </div>
        </div>
      </main>

      <BottomNav active="profile" />
    </div>
  );
}
