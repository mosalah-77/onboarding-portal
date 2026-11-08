import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Client Brief · Independent portfolio demo",
  description: "A synthetic client onboarding workflow with versioned briefs, private files and exact-version approval.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
