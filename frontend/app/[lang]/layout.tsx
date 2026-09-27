import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/vazirmatn";
import "@fontsource-variable/inter";
import "../globals.css";
import { Footer, Header, Providers, TabBar, themeScript } from "@/components/chrome";
import { dict, langs, type Lang } from "@/lib/i18n";

type P = { params: Promise<{ lang: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => langs.map((lang) => ({ lang }));

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const t = dict[(await params).lang as Lang];
  return { title: { default: `${t.brand} · ${t.tagline}`, template: `%s · ${t.brand}` }, description: t.hero.sub };
}

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#050507" },
  ],
};

export default async function Layout({ children, params }: P & { children: ReactNode }) {
  const lang = (await params).lang as Lang;
  return (
    <html lang={lang} dir={lang === "fa" ? "rtl" : "ltr"} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>
          <Header lang={lang} />
          <main className="min-h-dvh">{children}</main>
          <Footer lang={lang} />
          <TabBar lang={lang} />
        </Providers>
      </body>
    </html>
  );
}
