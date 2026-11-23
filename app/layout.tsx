import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Client Brief · Independent portfolio demo",
  description: "A synthetic client onboarding workflow with versioned briefs, private files and exact-version approval.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

const themeScript = "try{document.documentElement.dataset.theme=localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){}";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Runs before first paint so the saved or system theme never flashes the wrong colours. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
