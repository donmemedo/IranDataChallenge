import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Target, Trophy, Users } from "lucide-react";
import { api, type Detail, type Row } from "@/lib/api";
import { dict, nf, pick, type Lang } from "@/lib/i18n";
import { ChallengeTabs, KindBadge, sectorIcon } from "@/components/challenge";
import { Reveal } from "@/components/fx";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, slug } = await params;
  const c = await api<Detail>(`/challenges/${slug}`);
  return { title: pick(c, "title", lang as Lang), description: pick(c, "summary", lang as Lang) };
}

function Ring({ pct }: { pct: number }) {
  const r = 22, len = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 52 52" className="size-12 -rotate-90" aria-hidden>
      <defs>
        <linearGradient id="ring" x1="0" x2="1"><stop offset="0" stopColor="var(--accent)" /><stop offset="1" stopColor="var(--accent-3)" /></linearGradient>
      </defs>
      <circle cx="26" cy="26" r={r} fill="none" stroke="var(--line)" strokeWidth="5" />
      <circle cx="26" cy="26" r={r} fill="none" stroke="url(#ring)" strokeWidth="5" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - pct)} />
    </svg>
  );
}

export default async function ChallengePage({ params }: P) {
  const { slug, lang: l } = await params;
  const lang = l as Lang;
  const t = dict[lang];
  const [c, rows] = await Promise.all([api<Detail>(`/challenges/${slug}`), api<Row[]>(`/challenges/${slug}/leaderboard`)]);
  const total = (Date.parse(c.deadline) - Date.parse(c.start)) / 864e5;
  const Icon = sectorIcon[c.sector] ?? Target;
  const tiles = [
    [t.detail.prize, <span key="p" className="text-grad">{t.unit.prize(nf(lang, c.prize))}</span>, <Trophy key="i" className="size-5 text-accent" />],
    [t.detail.left, t.unit.days(nf(lang, c.days_left)), <Ring key="i" pct={Math.min(1, c.days_left / total)} />],
    [t.unit.teams(nf(lang, c.teams)), t.unit.people(nf(lang, c.participants)), <Users key="i" className="size-5 text-accent-2" />],
    [t.detail.top, c.top == null ? "—" : nf(lang, c.top, { maximumFractionDigits: 4 }), <Target key="i" className="size-5 text-accent-3" />],
  ] as const;

  return (
    <div className="relative">
      <div className="aurora !opacity-30"><i /><i /><i /></div>
      <div className="relative mx-auto max-w-6xl px-5 pt-28 sm:pt-32">
        <Link href={`/${lang}/challenges`} className="press inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg">
          <ArrowRight className="size-4 ltr:rotate-180" />{t.detail.back}
        </Link>
        <Reveal className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
          <span className="grid size-16 shrink-0 place-items-center rounded-[22px] bg-gradient-to-br from-accent via-accent-2 to-accent-3 text-white shadow-xl">
            <Icon className="size-8" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted"><KindBadge kind={c.kind} lang={lang} />{pick(c, "org", lang)}</div>
            <h1 className="display mt-3 text-3xl leading-tight font-black sm:text-5xl rtl:leading-[1.35]">{pick(c, "title", lang)}</h1>
            <p className="mt-3 max-w-2xl text-lg text-muted">{pick(c, "summary", lang)}</p>
          </div>
        </Reveal>
        <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tiles.map(([label, value, icon], i) => (
            <Reveal key={i} delay={i * 0.05}>
              <div className="glass flex h-full items-center justify-between gap-2 rounded-3xl p-4 sm:p-5">
                <div className="min-w-0">
                  <div className="text-xs text-muted">{label}</div>
                  <div className="mt-1 text-base leading-snug font-extrabold sm:text-xl">{value}</div>
                </div>
                {icon}
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-12"><ChallengeTabs c={c} rows={rows} lang={lang} /></div>
      </div>
    </div>
  );
}
