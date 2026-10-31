import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UtsavMate AI — Smart Celebration & Event Planner",
  description:
    "Budget-first, GenAI-powered event planning assistant for Indian weddings, birthdays, anniversaries, and community gatherings. Every celebration. One smart plan.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
