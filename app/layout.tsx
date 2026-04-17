import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Cinzel, Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/app/providers";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { COPY } from "@/lib/config/copy";
import "./globals.css";

const jacquard = localFont({
  src: "../public/Jacquard12-Regular.ttf",
  variable: "--font-display",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["500", "700"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["500", "600"],
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
      className={`dark ${jacquard.variable} ${cinzel.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-background font-sans text-text-primary antialiased">
        <Providers>{children}</Providers>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
