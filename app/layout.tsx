import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Providers } from "@/app/providers";
import { SolanaProvider } from "@/components/solana-provider";
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
      <body className="min-h-screen bg-background font-sans text-text-primary antialiased">
        <Providers>
          <SolanaProvider>{children}</SolanaProvider>
        </Providers>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
