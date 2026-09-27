import Link from "next/link";
import { ArrowRight, Box, EyeOff, FileCheck, Globe, GraduationCap, Lock, Rocket, Server, ShieldCheck, Sparkles, Users } from "lucide-react";
import { api, type Challenge, type Row, type Stats } from "@/lib/api";
import { dict, nf, pick, type Lang } from "@/lib/i18n";
import { ChallengeCard } from "@/components/challenge";
import { Counter, Reveal, Tilt } from "@/components/fx";
import { HowItWorks } from "@/components/sections";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ lang: string }> };

const products = [
  ["private", Lock, "sm:col-span-2 lg:row-span-2"],
  ["public", Globe, "sm:col-span-2"],
  ["academic", GraduationCap, ""],
  ["talent", Users, ""],
  ["anon", EyeOff, "sm:col-span-2"],
  ["mlops", Rocket, "sm:col-span-2"],
] as const;
const trustIcons = [Server, FileCheck, EyeOff, Box];

export default async function Home({ params }: P) {
  const lang = (await params).lang as Lang;
  const t = dict[lang];
  const [stats, list] = await Promise.all([api<Stats>("/stats"), api<Challenge[]>("/challenges")]);
  const hot = [...list].sort((a, b) => b.participants - a.participants).slice(0, 3);
  const live = hot[0];
  const board = (await api<Row[]>(`/challenges/${live.slug}/leaderboard`)).slice(0, 5);
  const bar = (s: number) => (live.higher_better ? s / board[0].score : board[0].score / s) * 100;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40">
        <div className="aurora"><i /><i /><i /></div>
        <div className="grid-bg" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <Reveal>
              <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold">
                <Sparkles className="size-3.5 text-accent" />{t.hero.eyebrow}
              </span>
            </Reveal>
            <Reveal delay={0.06}>
              <h1 className="display mt-6 text-[2.75rem] leading-[1.08] font-black sm:text-6xl lg:text-7xl rtl:leading-[1.3]">
                {t.hero.title1}<br /><span className="text-grad">{t.hero.title2}</span>
              </h1>
            </Reveal>
            <Reveal delay={0.12}><p className="mt-6 max-w-xl text-lg leading-8 text-muted">{t.hero.sub}</p></Reveal>
            <Reveal delay={0.18}>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href={`/${lang}/challenges`} className="btn btn-primary px-6 py-3.5">{t.hero.cta}<ArrowRight className="size-4 rtl:-scale-x-100" /></Link>
                <Link href={`/${lang}/business`} className="btn btn-ghost px-6 py-3.5">{t.hero.cta2}</Link>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.25}>
            <Tilt className="relative">
              <Link href={`/${lang}/challenges/${live.slug}`} className="glass block rounded-[32px] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-muted">{t.hero.liveTitle}</div>
                    <div className="truncate font-bold">{pick(live, "title", lang)}</div>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent-3/10 px-2.5 py-1 text-xs font-bold text-accent-3">
                    <span className="live-dot size-1.5 rounded-full bg-accent-3" />{t.hero.live}
                  </span>
                </div>
                <ol className="mt-5 space-y-2">
                  {board.map((r) => (
                    <li key={r.team} className="relative overflow-hidden rounded-2xl bg-fg/[.04] px-3 py-2.5">
                      <span className="absolute inset-y-0 start-0 bg-gradient-to-r from-accent/15 to-accent-2/15 rtl:bg-gradient-to-l" style={{ width: `${bar(r.score)}%` }} />
                      <span className="relative flex items-center gap-3 text-sm">
                        <span className="w-5 text-center font-bold text-muted tabular-nums">{nf(lang, r.rank)}</span>
                        <span dir="auto" className="flex-1 truncate text-start font-semibold">{r.team}</span>
                        <span className="font-mono font-semibold tabular-nums">{nf(lang, r.score, { maximumFractionDigits: 4 })}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </Link>
              <div className="glass absolute -end-3 -top-5 rounded-2xl px-4 py-2.5 text-sm font-bold sm:-end-6" style={{ transform: "translateZ(60px)" }}>
                <span className="text-grad">{t.unit.prize(nf(lang, live.prize))}</span>
              </div>
              <div className="glass absolute -start-3 -bottom-5 flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold sm:-start-6" style={{ transform: "translateZ(80px)" }}>
                <Users className="size-4 text-accent-2" />{t.unit.people(nf(lang, live.participants))}
              </div>
            </Tilt>
          </Reveal>
        </div>

        <div className="relative mx-auto mt-20 grid max-w-6xl grid-cols-2 gap-3 px-5 lg:grid-cols-4">
          {([["members", stats.members], ["challenges", stats.challenges], ["prize", stats.prize_pool], ["submissions", stats.submissions]] as const).map(([k, v], i) => (
            <Reveal key={k} delay={i * 0.06}>
              <div className="glass rounded-3xl p-5">
                <div className="display text-3xl font-black sm:text-4xl"><Counter value={v} lang={lang} /></div>
                <div className="mt-1 text-sm text-muted">{t.stats[k]}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Sectors marquee */}
      <div className="marquee overflow-hidden py-6" aria-hidden>
        <div>
          {[...t.sectors, ...t.sectors].map((s, i) => (
            <span key={i} className="mx-3 rounded-full border border-line px-5 py-2 text-sm font-medium whitespace-nowrap text-muted">{s}</span>
          ))}
        </div>
      </div>

      {/* Trending */}
      <section className="mx-auto mt-20 max-w-6xl px-5">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="display text-3xl font-extrabold sm:text-4xl">{t.hot.title}</h2>
            <p className="mt-2 text-muted">{t.hot.sub}</p>
          </div>
          <Link href={`/${lang}/challenges`} className="btn btn-ghost">{t.hot.all}<ArrowRight className="size-4 rtl:-scale-x-100" /></Link>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hot.map((c, i) => <Reveal key={c.slug} delay={i * 0.08} className="h-full"><ChallengeCard c={c} lang={lang} /></Reveal>)}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto mt-32 max-w-6xl px-5">
        <Reveal><h2 className="display mb-8 text-center text-3xl font-extrabold sm:text-5xl">{t.how.title}</h2></Reveal>
        <HowItWorks lang={lang} />
      </section>

      {/* Products bento */}
      <section className="mx-auto mt-32 max-w-6xl px-5">
        <Reveal><h2 className="display mx-auto max-w-2xl text-center text-3xl font-extrabold sm:text-5xl">{t.products.title}</h2></Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map(([k, Icon, span], i) => {
            const [title, body] = t.products.items[k];
            const big = k === "private";
            return (
              <Reveal key={k} delay={i * 0.05} className={span}>
                <div className={`spot glass relative flex h-full flex-col overflow-hidden rounded-[28px] p-6 ${big ? "min-h-80 justify-end sm:p-8" : ""}`}>
                  {big && <div className="aurora !opacity-40"><i /><i /><i /></div>}
                  <span className={`relative grid place-items-center rounded-2xl bg-gradient-to-br from-accent to-accent-3 text-white shadow-lg ${big ? "mb-auto size-16" : "size-11"}`}>
                    <Icon className={big ? "size-8" : "size-5"} />
                  </span>
                  <h3 className={`title relative mt-5 font-bold ${big ? "text-3xl" : "text-lg"}`}>{title}</h3>
                  <p className={`relative mt-2 leading-7 text-muted ${big ? "max-w-md" : "text-sm"}`}>{body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto mt-32 grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2">
        <div>
          <Reveal><h2 className="display text-4xl font-black sm:text-5xl">{t.trust.title}</h2></Reveal>
          <Reveal delay={0.05}><p className="mt-4 text-lg text-muted">{t.trust.sub}</p></Reveal>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {t.trust.items.map(([title, body], i) => {
              const Icon = trustIcons[i];
              return (
                <Reveal key={title} delay={0.08 + i * 0.05}>
                  <div className="glass h-full rounded-3xl p-5">
                    <Icon className="size-5 text-accent" />
                    <h3 className="mt-3 font-bold">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted">{body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
        <Reveal delay={0.1} className="relative mx-auto grid aspect-square w-full max-w-md place-items-center">
          {[1, 0.78, 0.56].map((s, i) => (
            <span key={s} className="absolute rounded-full border border-accent/30" style={{ width: `${s * 100}%`, height: `${s * 100}%`, animation: `drift ${6 + i * 2}s ease-in-out infinite alternate` }} />
          ))}
          <div className="absolute size-1/2 rounded-full bg-accent/30 blur-3xl" />
          <span className="relative grid size-36 place-items-center rounded-[40px] bg-gradient-to-br from-accent via-accent-2 to-accent-3 text-white shadow-2xl">
            <ShieldCheck className="size-16" strokeWidth={1.6} />
          </span>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-32 max-w-6xl px-5">
        <Reveal>
          <div className="glass relative overflow-hidden rounded-[40px] px-6 py-16 text-center sm:py-20">
            <div className="aurora"><i /><i /><i /></div>
            <div className="relative">
              <h2 className="display text-4xl font-black sm:text-6xl">{t.cta.title}</h2>
              <p className="mt-4 text-lg text-muted">{t.cta.sub}</p>
              <Link href={`/${lang}/business#contact`} className="btn btn-primary mt-8 px-7 py-4 text-base">{t.cta.btn}<ArrowRight className="size-4 rtl:-scale-x-100" /></Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
