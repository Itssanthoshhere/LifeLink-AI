import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LifeLink AI — Blood Supply Intelligence",
  description:
    "AI-powered blood supply command center for predictive shortage mitigation, network optimization, and intelligent donor dispatch.",
  keywords: [
    "blood supply AI",
    "healthcare logistics",
    "blood bank optimization",
    "shortage prediction",
    "MILP transshipment",
    "donor dispatch",
    "medical supply chain",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
