"use client";

import Link from "next/link";

const ACCESSIBLE_COUNTRIES = [
  { region: "Latin America", countries: "Brazil, Mexico, Colombia, Chile, Peru, Argentina, Uruguay, Paraguay, Costa Rica, Panama, Guatemala, Honduras, El Salvador, Dominican Republic, Jamaica, Trinidad & Tobago, Bahamas, Barbados" },
  { region: "Africa", countries: "Nigeria, South Africa, Kenya, Ghana, Cameroon, Ivory Coast, Senegal, Uganda, Rwanda, Mauritius, Madagascar, Mozambique, Namibia, Botswana, Zambia, Angola, Gabon, Benin, Togo, Congo" },
  { region: "Asia-Pacific", countries: "Philippines, Malaysia, Taiwan, Hong Kong, Mongolia, Sri Lanka, Fiji, Maldives, Papua New Guinea, Brunei" },
  { region: "Europe", countries: "Ukraine, Georgia, Serbia, Montenegro, Albania, Kosovo, Bosnia, North Macedonia, Moldova" },
  { region: "Other", countries: "Bermuda, Cayman Islands, Curaçao, Aruba, Isle of Man, Gibraltar" },
];

export default function BlockedPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center px-6 py-12">
      <div className="mx-auto max-w-md space-y-6">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-surface border border-border/40">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-12 w-12 text-no-glow">
            <circle cx="12" cy="12" r="10" />
            <path d="M4.93 4.93l14.14 14.14" />
          </svg>
        </div>

        <h1 className="font-display text-3xl text-text-primary text-center">
          Not available in your region
        </h1>

        <p className="text-sm text-text-secondary leading-relaxed text-center">
          Nostradameme is a crypto prediction game that involves real funds.
          Due to local regulations regarding online betting and cryptocurrency
          in your country, we are unable to provide access to our services
          in your region at this time.
        </p>

        <p className="text-sm text-text-secondary leading-relaxed text-center">
          We respect the laws of every jurisdiction and are committed to
          operating responsibly.
        </p>

        <div className="pt-4">
          <h2 className="font-display text-lg text-accent-glow text-center mb-4">
            Countries where Nostradameme is available
          </h2>

          <div className="space-y-3">
            {ACCESSIBLE_COUNTRIES.map((group) => (
              <div key={group.region} className="rounded-xl border border-border/40 bg-surface/40 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-widest text-accent-glow mb-1">
                  {group.region}
                </p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {group.countries}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-4 pt-4 text-xs text-text-muted">
          <Link href="/terms" className="hover:text-accent-glow">Terms</Link>
          <Link href="/privacy" className="hover:text-accent-glow">Privacy</Link>
          <a href="mailto:hello@nostradameme.com" className="hover:text-accent-glow">Contact</a>
        </div>
      </div>
    </div>
  );
}
