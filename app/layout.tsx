import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CleanClick – Professional Home Cleaning Services",
  description: "Book a professional home cleaning in under 60 seconds.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
