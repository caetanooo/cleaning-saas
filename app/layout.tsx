import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CleanClick – Professional Home Cleaning Services",
  description:
    "Top-rated residential cleaning services. Book a clean today and get a free instant quote in under 60 seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
