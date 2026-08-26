import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/400-italic.css";
import "@fontsource/playfair-display/500.css";
import "@fontsource/playfair-display/600.css";
import "./globals.css";

// Fonts are self-hosted via @fontsource (npm packages, not next/font/google)
// so the site never makes a request to Google's font CDN — better privacy,
// and it doesn't depend on network access to fonts.googleapis.com at
// build time either.

export const metadata: Metadata = {
  title: "Callin Watch Care",
  description:
    "Expert watch servicing, restoration, and refurbishment. Track your restoration's progress online.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-navy-950">{children}</body>
    </html>
  );
}
