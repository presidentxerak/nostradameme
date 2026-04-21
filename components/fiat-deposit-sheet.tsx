"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/config/copy";

interface FiatDepositSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FiatDepositSheet({ open, onOpenChange }: FiatDepositSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetTitle className="mb-1 font-sans text-xl font-bold text-accent-glow">
          Add funds by card
        </SheetTitle>
        <SheetDescription className="mb-4 text-sm text-text-secondary">
          Powered by XRPL
        </SheetDescription>

        <div className="flex flex-col items-center gap-5 py-8">
          <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8 text-accent-glow">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </div>
          <p className="text-base text-text-primary font-bold text-center">
            Card payments coming soon
          </p>
          <p className="text-sm text-text-secondary text-center max-w-xs">
            Fiat deposits via card (powered by XRPL) will be available shortly.
            For now, use Solana to add funds.
          </p>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
