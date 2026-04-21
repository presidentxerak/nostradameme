"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SolDepositSheet } from "@/components/sol-deposit-sheet";
import { XrpDepositSheet } from "@/components/xrp-deposit-sheet";

interface DepositChooserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "sol" | "xrp" | null;
  onModeChange: (mode: "sol" | "xrp" | null) => void;
  onComplete?: () => void;
}

export function DepositChooser({ open, onOpenChange, mode, onModeChange, onComplete }: DepositChooserProps) {
  if (mode === "sol") {
    return (
      <SolDepositSheet
        open={open}
        onOpenChange={(v) => {
          if (!v) onModeChange(null);
          onOpenChange(v);
        }}
        onComplete={onComplete}
      />
    );
  }

  if (mode === "xrp") {
    return (
      <XrpDepositSheet
        open={open}
        onOpenChange={(v) => {
          if (!v) onModeChange(null);
          onOpenChange(v);
        }}
        onComplete={onComplete}
      />
    );
  }

  // Mode chooser
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetTitle className="mb-1 font-sans text-xl font-bold text-accent-glow">
          Add funds
        </SheetTitle>
        <SheetDescription className="mb-4 text-sm text-text-secondary">
          Choose how you want to deposit
        </SheetDescription>

        <div className="space-y-3">
          <button
            onClick={() => onModeChange("sol")}
            className="w-full flex items-center gap-4 rounded-xl border border-accent/30 bg-surface/60 px-4 py-4 text-left transition-all hover:border-accent/60 hover:bg-surface"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-xl font-bold text-accent-glow">
              S
            </div>
            <div className="flex-1">
              <p className="font-sans text-sm font-bold text-text-primary">Deposit SOL</p>
              <p className="text-xs text-text-muted">Via Phantom, Solflare, or any Solana wallet</p>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-text-muted">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          <button
            onClick={() => onModeChange("xrp")}
            className="w-full flex items-center gap-4 rounded-xl border border-border/40 bg-surface/40 px-4 py-4 text-left transition-all hover:border-accent/40 hover:bg-surface/60"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-xl font-bold text-text-secondary">
              X
            </div>
            <div className="flex-1">
              <p className="font-sans text-sm font-bold text-text-primary">Deposit XRP</p>
              <p className="text-xs text-text-muted">Via Xaman, GemWallet, or any XRPL wallet</p>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-text-muted">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        <Button variant="ghost" className="mt-4 w-full" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
      </SheetContent>
    </Sheet>
  );
}
