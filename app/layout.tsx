import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Hind, Tiro_Devanagari_Hindi } from "next/font/google";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ServiceWorker } from "@/components/ServiceWorker";
import { getConfig } from "@/lib/config";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/lang-server";
import "./globals.css";

const tiro = Tiro_Devanagari_Hindi({
  variable: "--font-tiro",
  weight: "400",
  subsets: ["latin", "devanagari"],
  display: "swap",
});

const hind = Hind({
  variable: "--font-hind",
  weight: ["400", "500", "600"],
  subsets: ["latin", "devanagari"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MIRAS: Udaipur heritage and local makers",
  description: "Find a heritage site, read a sourced story, and meet a local artisan in Udaipur.",
  applicationName: "MIRAS",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MIRAS",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#131B31",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await getLang();
  const { demoMode } = getConfig();
  const nav = [
    { href: "/", label: t(lang, "navExplore") },
    { href: "/artisans", label: t(lang, "navArtisans") },
    { href: "/camera", label: t(lang, "navCamera") },
    { href: "/search", label: t(lang, "navSearch") },
  ];
  return (
    <html lang={lang} className={`${tiro.variable} ${hind.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <ServiceWorker />
        <InstallPrompt />
        {demoMode && (
          <div className="bg-ink px-4 py-1.5 text-center text-xs text-paper">
            Demo mode: sample content is shown and badged. Nothing marked sample is real.
          </div>
        )}
        <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2">
            <Link href="/" className="font-display text-2xl tracking-wide">
              {t(lang, "appName")}
            </Link>
            <LanguageSwitch lang={lang} />
          </div>
          <nav aria-label="Main" className="mx-auto max-w-3xl px-2">
            <ul className="flex justify-between gap-1 text-sm sm:justify-start sm:gap-4">
              {nav.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="inline-flex min-h-10 items-center rounded-full px-3 hover:bg-ink/5">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5">{children}</main>
        <footer className="border-t border-line px-4 py-6 text-center text-xs text-ink-soft">
          <nav aria-label="Explore more" className="mx-auto mb-4 max-w-3xl">
            <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-ink">
              {[
                ["/plan", "Plan your day"],
                ["/trails", "Trails"],
                ["/memories", "Memories"],
                ["/passport", "Passport"],
                ["/events", "Events"],
                ["/picks", "Hidden Udaipur"],
                ["/offline", "Offline copies"],
                ["/replay", "360 replay"],
                ["/concept/ar", "Story view (concept)"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="inline-flex min-h-9 items-center underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <p>MIRAS by Team Impala. Stories show their source type: history, oral tradition or legend.</p>
          <p className="mt-1">
            <Link href="/onboard" className="underline">
              For artisans: create a listing
            </Link>
            {" · "}
            <Link href="/story" className="underline">
              Udaipur story
            </Link>
            {" · "}
            <Link href="/admin" className="underline">
              Status
            </Link>
          </p>
        </footer>
      </body>
    </html>
  );
}
