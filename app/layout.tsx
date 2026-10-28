import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Hind, Tiro_Devanagari_Hindi } from "next/font/google";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ServiceWorker } from "@/components/ServiceWorker";
import { BottomNav, TopBar } from "@/components/shell";
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
  return (
    <html lang={lang} className={`${tiro.variable} ${hind.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <ServiceWorker />
        <InstallPrompt />
        {demoMode && (
          <div className="bg-ink px-4 py-1.5 text-center text-xs text-on-dark">
            Demo mode: sample content is shown and badged. Nothing marked sample is real.
          </div>
        )}
        <TopBar appName={t(lang, "appName")} right={<LanguageSwitch lang={lang} />} />
        <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-5">{children}</main>
        <footer className="pb-nav border-t border-line px-5 pt-6 text-center text-xs text-muted-paper">
          <nav aria-label="Explore more" className="mx-auto mb-4 max-w-3xl">
            <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-on-paper">
              {[
                ["/search", t(lang, "navSearch")],
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
        <BottomNav
          labels={{
            home: t(lang, "navHome"),
            places: t(lang, "navPlaces"),
            camera: t(lang, "navCamera"),
            stories: t(lang, "navStories"),
            makers: t(lang, "navMakers"),
          }}
        />
      </body>
    </html>
  );
}
