import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pokémon SoulLink Challenge",
  description: "Lokaler SoulLink-Tracker für Pokémon-Challenges"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning className="dark">
      <body>{children}</body>
    </html>
  );
}
