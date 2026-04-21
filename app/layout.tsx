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
        {/* Fixed background image + dark overlay */}
        <div className="fixed inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url(/background-2.png)" }}
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        {/* App content above the background */}
        <div className="relative z-10">
          <Providers>
            <SolanaProvider>{children}</SolanaProvider>
          </Providers>
          <ServiceWorkerRegister />
        </div>
      </body>
    </html>
  );
}
