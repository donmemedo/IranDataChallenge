import type { Metadata } from "next";
import { Check } from "lucide-react";
import { dict, type Lang } from "@/lib/i18n";
import { Reveal } from "@/components/fx";
import { LeadForm } from "@/components/sections";

type P = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  return { title: dict[(await params).lang as Lang].biz.eyebrow };
}

export default async function Business({ params }: P) {
  const lang = (await params).lang as Lang;
  const b = dict[lang].biz;
  return (
    <>
      <section className="relative overflow-hidden pt-36 pb-10 text-center sm:pt-44">
        <div className="aurora"><i /><i /><i /></div>
        <div className="grid-bg" />
        <div className="relative mx-auto max-w-4xl px-5">
          <Reveal><span className="glass inline-block rounded-full px-3 py-1.5 text-xs font-semibold">{b.eyebrow}</span></Reveal>
          <Reveal delay={0.06}><h1 className="display mt-6 text-4xl leading-[1.1] font-black sm:text-6xl rtl:leading-[1.35]"><span className="text-grad">{b.title}</span></h1></Reveal>
          <Reveal delay={0.12}><p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted">{b.sub}</p></Reveal>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-5">
        <Reveal className="text-center">
          <h2 className="display text-3xl font-extrabold sm:text-4xl">{b.pricing}</h2>
          <p className="mt-2 text-sm text-muted">{b.pricingSub}</p>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(b.plans).map(([k, [name, price, per, features]], i) => {
            const hot = k === "private";
            return (
              <Reveal key={k} delay={i * 0.05} className={hot ? "lg:row-span-2" : ""}>
                <div className={`spot relative flex h-full flex-col rounded-[28px] p-6 sm:p-7 ${hot ? "shadow-2xl" : "glass"}`}
                  style={hot ? { border: "1.5px solid transparent", background: "linear-gradient(var(--solid), var(--solid)) padding-box, linear-gradient(135deg, var(--accent), var(--accent-2), var(--accent-3)) border-box" } : undefined}>
                  {hot && <span className="absolute -top-3 start-6 rounded-full bg-gradient-to-r from-accent to-accent-3 px-3 py-1 text-xs font-bold text-white">{b.popular}</span>}
                  <h3 className="text-lg font-bold">{name}</h3>
                  <div className="mt-4 flex flex-wrap items-baseline gap-x-2">
                    <span className={`display font-black ${hot ? "text-grad text-4xl" : "text-3xl"}`}>{price}</span>
                    <span className="text-sm text-muted">{b.unit}</span>
                  </div>
                  <div className="mt-1 text-sm text-muted">{per}</div>
                  <ul className="mt-6 space-y-3 text-sm">
                    {features.map((f) => <li key={f} className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-ok" />{f}</li>)}
                  </ul>
                  <a href="#contact" className={`btn mt-auto w-full ${hot ? "btn-primary" : "btn-ghost"}`} style={{ marginTop: "2rem" }}>{b.choose}</a>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section id="contact" className="mx-auto mt-24 max-w-3xl scroll-mt-24 px-5">
        <Reveal><LeadForm lang={lang} /></Reveal>
      </section>
    </>
  );
}
