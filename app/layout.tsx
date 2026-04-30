import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Providers } from "@/app/providers";
import { SolanaProvider } from "@/components/solana-provider";
import { XrplWalletProvider } from "@/components/xrpl-wallet-provider";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { COPY } from "@/lib/config/copy";
import "./globals.css";

const jacquard = localFont({
  src: "../public/Jacquard12-Regular.ttf",
  variable: "--font-display",
  display: "swap",
});

const silkscreen = localFont({
  src: "../public/Silkscreen-Regular.ttf",
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${COPY.app.name} — ${COPY.app.tagline}`,
  description: COPY.app.tagline,
  metadataBase: new URL("https://nostradameme.com"),
  icons: {
    icon: "/logo-nostradameme.png",
    apple: "/logo-nostradameme.png",
  },
  openGraph: {
    title: COPY.app.name,
    description: COPY.app.tagline,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: COPY.app.name,
    description: COPY.app.tagline,
  },
};

export const viewport: Viewport = {
  themeColor: "#06060c",
  initialScale: 1,
  width: "device-width",
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${jacquard.variable} ${silkscreen.variable}`}
    >
      <body className="min-h-screen font-sans text-text-primary antialiased">
        {/* Fixed background video + dark overlay */}
        <div className="fixed inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            src="/background-video.mp4"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        {/* App content above the background — constrained to a centered phone-like frame on desktop */}
        <div className="relative z-10 mx-auto flex min-h-screen max-w-lg flex-col border-x border-border/20 shadow-[0_0_60px_rgba(0,0,0,0.6)]">
          <Providers>
            <SolanaProvider>
              <XrplWalletProvider>{children}</XrplWalletProvider>
            </SolanaProvider>
          </Providers>
          <ServiceWorkerRegister />
        </div>
      </body>
    </html>
  );
}
