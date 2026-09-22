import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Blood Supply Command Center",
  description: "Operational logistics dashboard for AI-assisted blood supply monitoring and MILP transshipment optimization",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-ops-bg text-ops-text">
        {children}
      </body>
    </html>
  );
}
