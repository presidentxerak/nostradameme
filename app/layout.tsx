import type { Metadata, Viewport } from "next";
import { Providers } from "@/app/providers";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { COPY } from "@/lib/config/copy";
import "./globals.css";

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
  themeColor: "#0a0a0f",
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
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Cinzel:wght@500;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background font-sans text-text-primary antialiased">
        <Providers>{children}</Providers>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
