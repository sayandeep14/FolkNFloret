import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Folk & Floret — The Art of Keeping",
  description:
    "Preserved botanicals, hand-poured candles and estate provisions, composed into keepsake suites for the moments meant to be kept.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/*
          Loaded at runtime rather than via next/font, which fetches at build
          time and fails in an offline build environment.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@200;300;400;500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
