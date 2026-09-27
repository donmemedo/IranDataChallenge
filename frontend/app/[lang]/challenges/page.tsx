import type { Metadata } from "next";
import { api, type Challenge } from "@/lib/api";
import { dict, type Lang } from "@/lib/i18n";
import { ChallengeBrowser } from "@/components/challenge";
import { Reveal } from "@/components/fx";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  return { title: dict[(await params).lang as Lang].list.title };
}

export default async function Challenges({ params }: P) {
  const lang = (await params).lang as Lang;
  const t = dict[lang].list;
  const items = await api<Challenge[]>("/challenges");
  return (
    <section className="relative mx-auto max-w-6xl px-5 pt-32 sm:pt-36">
      <div className="aurora !opacity-25"><i /><i /><i /></div>
      <Reveal className="relative mb-10">
        <h1 className="display text-4xl font-black sm:text-6xl">{t.title}</h1>
        <p className="mt-3 text-lg text-muted">{t.sub}</p>
      </Reveal>
      <div className="relative"><ChallengeBrowser items={items} lang={lang} /></div>
    </section>
  );
}
