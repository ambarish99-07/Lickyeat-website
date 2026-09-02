import type { Metadata } from "next";
import "./globals.css";
import { display, sans } from "@/lib/fonts";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AppBanner } from "@/components/AppBanner";
import { SignupPrompt } from "@/components/SignupPrompt";
import { ActiveOrderPills } from "@/components/ActiveOrderPills";
import { ToastHost } from "@/components/ToastHost";

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3100"),
  title: {
    default: "Lickyeat — shakes, mocktails & home-style tiffin in Patna",
    template: "%s · Lickyeat",
  },
  description:
    "One Lickyeat, many kitchens. Order thick shakes from The Blenders Club, zero-proof cocktails from The Alchemy Tails, and daily home-style tiffin from GG Tiffin Service — delivered across Patna.",
  openGraph: {
    title: "Lickyeat",
    description: "Shakes, mocktails and home-style tiffin, delivered across Patna.",
    type: "website",
  },
};

// Runs before first paint — applies a saved light/dark choice so there's no flash.
const themeScript = `try{var t=localStorage.getItem('lky_theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t;}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-screen flex-col font-sans">
        <Providers>
          <AppBanner />
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <ActiveOrderPills />
          <ToastHost />
          <SignupPrompt />
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
