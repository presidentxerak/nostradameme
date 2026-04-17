"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type NavPage = "oracle" | "predictions" | "profile";

interface BottomNavProps {
  active: NavPage;
}

const NAV_ITEMS: { key: NavPage; href: string; label: string; icon: JSX.Element }[] = [
  {
    key: "oracle",
    href: "/",
    label: "Oracle",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4" />
        <line x1="12" y1="2" x2="12" y2="4" />
        <line x1="12" y1="20" x2="12" y2="22" />
        <line x1="2" y1="12" x2="4" y2="12" />
        <line x1="20" y1="12" x2="22" y2="12" />
      </svg>
    ),
  },
  {
    key: "predictions",
    href: "/predictions",
    label: "My predictions",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 14l2 2 4-4" />
      </svg>
    ),
  },
  {
    key: "profile",
    href: "/profile",
    label: "Profile",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <circle cx="12" cy="8" r="4" />
        <path d="M20 21a8 8 0 10-16 0" />
      </svg>
    ),
  },
];

export function BottomNav({ active }: BottomNavProps) {
  return (
    <nav className="z-50 shrink-0 border-t border-border/40 bg-background/95 backdrop-blur-md safe-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.key;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-1 transition-colors",
                isActive
                  ? "text-accent-glow"
                  : "text-text-muted hover:text-text-secondary",
              )}
            >
              <div className={cn(isActive && "text-glow-accent")}>
                {item.icon}
              </div>
              <span className="text-[10px] tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
