import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";
import { ActiveOrderPills } from "@/components/ActiveOrderPills";

export const metadata: Metadata = {
  title: "Lickyeat — shakes, mocktails & home-style tiffin in Patna",
  description:
    "Order from The Blenders Club, The Alchemy Tails and GG Tiffin Service — one app, quick delivery across Patna.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <Providers>
          <Header />
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
          <ActiveOrderPills />
          <footer className="mt-16 border-t border-black/10 py-8 text-center text-xs text-black/40">
            Lickyeat · Patna, Bihar · This is a demo build.
          </footer>
        </Providers>
      </body>
    </html>
  );
}
