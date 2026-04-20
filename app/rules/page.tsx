"use client";

import { BottomNav } from "@/components/bottom-nav";
import { COPY } from "@/lib/config/copy";

export default function RulesPage() {
  return (
    <div className="relative flex h-[100dvh] flex-col bg-background overflow-hidden">
      <header className="z-40 flex items-center justify-between border-b border-border/20 bg-background/90 px-4 py-3 backdrop-blur-md">
        <h1 className="font-display text-lg text-accent-glow text-glow-accent">
          Rules
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-20 pt-4">
        <div className="mx-auto max-w-lg space-y-8">

          <section>
            <h2 className="font-display text-xl text-accent-glow mb-3">
              How it works
            </h2>
            <div className="space-y-3 text-sm text-text-secondary leading-relaxed">
              <p>
                Three times a day, Nostradameme reveals a prophecy about the price
                of a cryptocurrency. You have a limited time to predict: will the
                price go <span className="text-yes font-bold">YES</span> or{" "}
                <span className="text-no font-bold">NO</span>?
              </p>
              <p>
                When the timer runs out, the real price is checked. If you predicted
                correctly, you win a share of the prize pool. If not, you lose
                your stake.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl text-accent-glow mb-3">
              Schedule
            </h2>
            <div className="rounded-xl border border-border/40 bg-surface/60 p-4 space-y-2">
              <p className="text-sm text-text-primary font-bold">
                24 prophecies per day — one every hour
              </p>
              <p className="text-sm text-text-secondary">
                A new prophecy opens at the top of every hour (00:00, 01:00, 02:00... 23:00 UTC)
                and lasts exactly 1 hour. The oracle never sleeps.
              </p>
              <p className="text-sm text-text-secondary">
                Each hour features a different crypto asset (BTC, ETH, SOL)
                rotating automatically.
              </p>
            </div>
            <p className="mt-2 text-xs text-text-muted">
              All times in UTC. New prophecies appear automatically.
              If you miss one, you cannot bet on it.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-accent-glow mb-3">
              How to play
            </h2>
            <ol className="space-y-4 text-sm text-text-secondary">
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent-glow font-bold text-xs">1</span>
                <div>
                  <p className="text-text-primary font-bold">Sign in</p>
                  <p>Tap &ldquo;{COPY.auth.signIn}&rdquo; and create your account with email.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent-glow font-bold text-xs">2</span>
                <div>
                  <p className="text-text-primary font-bold">Wait for a prophecy</p>
                  <p>A new prediction card appears at 9 AM, 12 PM, and midnight. Read the question carefully.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent-glow font-bold text-xs">3</span>
                <div>
                  <p className="text-text-primary font-bold">Choose YES or NO</p>
                  <p>Tap the <span className="text-yes font-bold">YES</span> or{" "}
                  <span className="text-no font-bold">NO</span> button.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent-glow font-bold text-xs">4</span>
                <div>
                  <p className="text-text-primary font-bold">Set your amount</p>
                  <p>Choose $1, $5, $10, $25, or a custom amount. Minimum $1, maximum $500.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent-glow font-bold text-xs">5</span>
                <div>
                  <p className="text-text-primary font-bold">Seal your prophecy</p>
                  <p>Confirm your bet. You can only bet once per prophecy. No changes after.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent-glow font-bold text-xs">6</span>
                <div>
                  <p className="text-text-primary font-bold">Wait for the oracle</p>
                  <p>When the timer hits zero, the real price is checked. The oracle reveals the result.</p>
                </div>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="font-display text-xl text-accent-glow mb-3">
              How winnings work
            </h2>
            <div className="space-y-3 text-sm text-text-secondary leading-relaxed">
              <p>
                All bets go into a shared pool. When the prophecy resolves,
                the <strong className="text-text-primary">winning side splits the entire pool</strong> proportionally
                to each player&apos;s stake.
              </p>
              <div className="rounded-xl border border-border/40 bg-surface/60 p-4 space-y-2">
                <p className="text-text-primary font-bold">Example:</p>
                <p>Total pool: $100 (YES pool: $30, NO pool: $70)</p>
                <p>Platform fee: 5% = $5</p>
                <p>Distributable: $95</p>
                <p className="text-yes">
                  If YES wins: you bet $10 on YES → you get ($10/$30) x $95 = <strong>$31.67</strong>
                </p>
                <p className="text-no">
                  If NO wins: your $10 on YES → you get <strong>$0</strong>
                </p>
              </div>
              <p>
                The earlier you bet on the minority side, the higher your
                potential return. The payout estimate updates live as bets come in.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl text-accent-glow mb-3">
              Rules
            </h2>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex gap-2">
                <span className="text-accent-glow">-</span>
                <span>One bet per prophecy per player</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent-glow">-</span>
                <span>Minimum bet: $1. Maximum bet: $500</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent-glow">-</span>
                <span>Bets are locked 5 minutes before the timer ends</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent-glow">-</span>
                <span>You cannot cancel or change a bet once sealed</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent-glow">-</span>
                <span>Platform fee: 5% taken from the total pool</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent-glow">-</span>
                <span>If a prophecy is canceled, all bets are fully refunded</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent-glow">-</span>
                <span>Prices are verified using live market data at the moment the timer expires</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-accent-glow mb-3">
              Oracle titles
            </h2>
            <p className="text-sm text-text-secondary mb-3">
              Your title reflects your prediction accuracy. You need at least 5
              predictions to earn a title.
            </p>
            <div className="rounded-xl border border-border/40 bg-surface/60 overflow-hidden text-sm">
              {[
                { range: "0-20%", title: "Blind Prophet", color: "#8b8ba0" },
                { range: "20-40%", title: "Apprentice Seer", color: "#6b7280" },
                { range: "40-55%", title: "The Lurker", color: "#8b5cf6" },
                { range: "55-65%", title: "True Oracle", color: "#a78bfa" },
                { range: "65-75%", title: "Enlightened One", color: "#a78bfa" },
                { range: "75-85%", title: "Grand Seer", color: "#f59e0b" },
                { range: "85%+", title: "Nostradameme Himself", color: "#ff0062" },
              ].map((t) => (
                <div key={t.title} className="flex items-center justify-between px-4 py-2 border-b border-border/20 last:border-0">
                  <span style={{ color: t.color }} className="font-bold">{t.title}</span>
                  <span className="text-text-muted">{t.range} win rate</span>
                </div>
              ))}
            </div>
          </section>

          <section className="pb-4">
            <p className="text-xs text-text-muted text-center">
              {COPY.legal.notFinancialAdvice}
            </p>
          </section>

        </div>
      </main>

      <BottomNav active="oracle" />
    </div>
  );
}
