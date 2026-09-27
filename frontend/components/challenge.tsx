"use client";
import Link from "next/link";
import { useMemo, useState, type DragEvent, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight, Check, Clock, CloudUpload, Download, FileCheck, GraduationCap, HeartPulse, Landmark, LoaderCircle,
  Lock, RadioTower, Search, ShieldCheck, ShoppingBag, Target, Trophy, Users, Zap,
} from "lucide-react";
import type { Challenge, Detail, Kind, Row } from "@/lib/api";
import { ago, df, dict, nf, pick, type Lang } from "@/lib/i18n";
import { Confetti, Counter, Segmented } from "./fx";

export const sectorIcon = { bank: Landmark, insurance: ShieldCheck, telecom: RadioTower, health: HeartPulse, energy: Zap, retail: ShoppingBag, education: GraduationCap } as Record<string, typeof Zap>;
const kindStyle: Record<Kind, string> = { public: "bg-accent-2/12 text-accent-2", private: "bg-accent/12 text-accent", academic: "bg-ok/12 text-ok" };
const spring = { type: "spring", bounce: 0, duration: 0.5 } as const;
const fmtScore = (lang: Lang, s: number) => nf(lang, s, { maximumFractionDigits: 4, minimumFractionDigits: s < 10 ? 4 : 2 });

export function KindBadge({ kind, lang }: { kind: Kind; lang: Lang }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${kindStyle[kind]}`}>
      {kind === "private" && <Lock className="size-3" />}
      {kind === "academic" && <GraduationCap className="size-3" />}
      {dict[lang].kind[kind]}
    </span>
  );
}

export function ChallengeCard({ c, lang }: { c: Challenge; lang: Lang }) {
  const t = dict[lang];
  const Icon = sectorIcon[c.sector] ?? Target;
  return (
    <Link href={`/${lang}/challenges/${c.slug}`} className="spot glass press group flex h-full flex-col rounded-[28px] p-5 transition-transform duration-300 hover:-translate-y-1 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent-2/20 text-accent">
            <Icon className="size-5" />
          </span>
          <div className="space-y-1">
            <div className="text-xs text-muted">{pick(c, "org", lang)}</div>
            <KindBadge kind={c.kind} lang={lang} />
          </div>
        </div>
        <ArrowUpRight className="size-5 text-muted opacity-0 transition-all duration-300 group-hover:opacity-100 rtl:-scale-x-100" />
      </div>
      <h3 className="title mt-5 text-lg leading-snug font-bold">{pick(c, "title", lang)}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{pick(c, "summary", lang)}</p>
      <div className="mt-auto flex items-end justify-between gap-3 pt-6">
        <div>
          <div className="text-xs text-muted">{t.detail.prize}</div>
          <div className="text-grad text-xl font-extrabold">{t.unit.prize(nf(lang, c.prize))}</div>
        </div>
        <div className="space-y-1 text-end text-xs text-muted">
          <div className="flex items-center justify-end gap-1"><Clock className="size-3.5" />{t.unit.days(nf(lang, c.days_left))}</div>
          <div className="flex items-center justify-end gap-1"><Users className="size-3.5" />{t.unit.people(nf(lang, c.participants))}</div>
        </div>
      </div>
    </Link>
  );
}

export function ChallengeBrowser({ items, lang }: { items: Challenge[]; lang: Lang }) {
  const t = dict[lang];
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"all" | Kind>("all");
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter((c) => (kind === "all" || c.kind === kind) &&
      (!s || [c.title_fa, c.title_en, c.org_fa, c.org_en, c.summary_fa, c.summary_en].some((v) => v.toLowerCase().includes(s))));
  }, [items, q, kind]);
  const count = (k: Kind) => items.filter((c) => c.kind === k).length;
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented id="kind" value={kind} onChange={setKind} items={[
          ["all", <>{t.list.all} <small className="text-muted">{nf(lang, items.length)}</small></>],
          ...(["public", "private", "academic"] as Kind[]).map((k) => [k, <>{t.kind[k]} <small className="text-muted">{nf(lang, count(k))}</small></>] as [Kind, ReactNode]),
        ]} />
        <label className="glass flex h-12 items-center gap-2 rounded-full px-4 focus-within:ring-2 focus-within:ring-accent sm:w-80">
          <Search className="size-4 text-muted" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.list.search} aria-label={t.list.search}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted" />
        </label>
      </div>
      <motion.div layout className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {shown.map((c) => (
            <motion.div key={c.slug} layout initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} transition={spring}>
              <ChallengeCard c={c} lang={lang} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      {!shown.length && <p className="py-20 text-center text-muted">{t.list.empty}</p>}
    </>
  );
}

type Tab = "overview" | "data" | "board" | "submit";
type Result = { score: number; best: number; rank: number; total: number };

export function ChallengeTabs({ c, rows: initial, lang }: { c: Detail; rows: Row[]; lang: Lang }) {
  const t = dict[lang].detail;
  const [tab, setTab] = useState<Tab>("overview");
  const [rows, setRows] = useState(initial);
  const [me, setMe] = useState<string>();
  const done = async (team: string) => {
    setMe(team);
    const r = await fetch(`/api/challenges/${c.slug}/leaderboard`);
    if (r.ok) setRows(await r.json());
  };
  return (
    <div>
      <div className="sticky top-20 z-30 flex justify-center">
        <Segmented id="detail-tab" value={tab} onChange={setTab} items={(Object.keys(t.tabs) as Tab[]).map((k) => [k, t.tabs[k]])} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} className="mt-8" initial={{ opacity: 0, y: 12, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(6px)" }} transition={{ type: "spring", bounce: 0, duration: 0.35 }}>
          {tab === "overview" && <Overview c={c} lang={lang} />}
          {tab === "data" && <Data c={c} lang={lang} />}
          {tab === "board" && <Board rows={rows} me={me} lang={lang} />}
          {tab === "submit" && <Submit c={c} lang={lang} onDone={done} onView={() => setTab("board")} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const Card = ({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) => (
  <section className={`glass rounded-[28px] p-6 ${className}`}>
    <h2 className="mb-3 text-sm font-semibold text-muted">{title}</h2>
    {children}
  </section>
);

function Overview({ c, lang }: { c: Detail; lang: Lang }) {
  const t = dict[lang];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="space-y-4 md:col-span-2">
        <Card title={t.detail.about}><p className="leading-8">{pick(c, "desc", lang)}</p></Card>
        <Card title={t.detail.rules}>
          <ul className="space-y-3">
            {t.detail.ruleList.map((r) => (
              <li key={r} className="flex gap-3 leading-7"><Check className="mt-1.5 size-4 shrink-0 text-ok" />{r}</li>
            ))}
          </ul>
        </Card>
      </div>
      <div className="space-y-4">
        <Card title={t.detail.eval}>
          <div className="text-grad text-2xl font-extrabold">{t.metric[c.metric]}</div>
          <p className="mt-2 text-sm leading-7 text-muted">{t.metricHelp[c.metric]}</p>
        </Card>
        <Card title={t.detail.timeline}>
          <ol className="relative space-y-5 border-s border-line ps-5">
            {[[t.detail.start, c.start], [t.detail.end, c.deadline]].map(([k, v], i) => (
              <li key={k} className="relative">
                <span className={`absolute -start-[27px] top-1 size-3 rounded-full ring-4 ring-bg ${i ? "bg-accent-3" : "bg-accent"}`} />
                <div className="text-xs text-muted">{k}</div>
                <div className="font-semibold">{df(lang, v)}</div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}

function Data({ c, lang }: { c: Detail; lang: Lang }) {
  const t = dict[lang].detail;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title={t.features}>
        <div className="flex flex-wrap gap-2" dir="ltr">
          {c.features.map((f) => <code key={f} className="rounded-xl bg-fg/5 px-3 py-1.5 font-mono text-xs">{f}</code>)}
        </div>
      </Card>
      <Card title={t.format}>
        <p className="text-sm leading-7 text-muted">{t.formatHelp(nf(lang, c.rows))}</p>
        <pre dir="ltr" className="mt-4 rounded-2xl bg-fg/5 p-4 font-mono text-xs leading-6">{"id,prediction\n1,…\n2,…\n…"}</pre>
        <a href={`/api/challenges/${c.slug}/sample.csv`} download className="btn btn-ghost mt-4 w-full"><Download className="size-4" />{t.sample}</a>
      </Card>
    </div>
  );
}

const medal = ["from-[#ffe27a] to-[#f0a202]", "from-[#eef1f5] to-[#9aa4b2]", "from-[#f6c79c] to-[#b8673a]"];
function Board({ rows, me, lang }: { rows: Row[]; me?: string; lang: Lang }) {
  const t = dict[lang].detail;
  return (
    <div className="glass overflow-hidden rounded-[28px]">
      <table className="w-full text-sm">
        <thead className="text-xs text-muted">
          <tr className="border-b border-line">
            <th className="w-16 p-4 text-start font-medium">{t.rank}</th>
            <th className="p-4 text-start font-medium">{t.team}</th>
            <th className="p-4 text-end font-medium">{t.score}</th>
            <th className="hidden p-4 text-end font-medium sm:table-cell">{t.entries}</th>
            <th className="hidden p-4 text-end font-medium md:table-cell">{t.last}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <motion.tr key={r.team} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: Math.min(i, 12) * 0.03 }}
              className={`border-b border-line last:border-0 ${r.team === me ? "bg-accent/10" : "hover:bg-fg/[.03]"}`}>
              <td className="p-4">
                {r.rank <= 3
                  ? <span className={`grid size-8 place-items-center rounded-full bg-gradient-to-br text-xs font-bold text-black/70 shadow ${medal[r.rank - 1]}`}>{nf(lang, r.rank)}</span>
                  : <span className="ps-2.5 font-semibold text-muted tabular-nums">{nf(lang, r.rank)}</span>}
              </td>
              <td className="p-4 font-semibold">
                <bdi>{r.team}</bdi>
                {r.team === me && <span className="ms-2 rounded-full bg-accent px-2 py-0.5 text-[10px] text-white">{t.you}</span>}
              </td>
              <td className="p-4 text-end font-mono font-semibold tabular-nums">{fmtScore(lang, r.score)}</td>
              <td className="hidden p-4 text-end text-muted tabular-nums sm:table-cell">{nf(lang, r.entries)}</td>
              <td className="hidden p-4 text-end text-muted md:table-cell" suppressHydrationWarning>{ago(lang, r.last)}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Submit({ c, lang, onDone, onView }: { c: Detail; lang: Lang; onDone: (team: string) => void; onView: () => void }) {
  const t = dict[lang].submit;
  const [team, setTeam] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [nda, setNda] = useState(false);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<{ field?: "team" | "file" | "form"; code: string }>();
  const [res, setRes] = useState<Result>();

  const drop = (e: DragEvent) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); };
  async function send(e: FormEvent) {
    e.preventDefault();
    if (!team.trim()) return setErr({ field: "team", code: "empty" });
    if (!file) return setErr({ field: "file", code: "nofile" });
    setErr(undefined); setBusy(true);
    const fd = new FormData();
    fd.append("team", team.trim()); fd.append("file", file); fd.append("nda", String(nda));
    try {
      const r = await fetch(`/api/challenges/${c.slug}/submit`, { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) return setErr({ field: j.detail === "bad_team" ? "team" : "form", code: typeof j.detail === "string" ? j.detail : "bad_file" });
      setRes(j); onDone(team.trim());
    } catch { setErr({ field: "form", code: "network" }); } finally { setBusy(false); }
  }
  const msg = (f: string) => err?.field === f && <p role="alert" className="mt-2 text-sm font-medium text-accent-3">{t.errors[err.code] ?? t.errors.bad_file}</p>;

  return (
    <div className="mx-auto max-w-xl">
      <AnimatePresence mode="wait">
        {res ? (
          <motion.div key="res" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.6 }} className="glass relative overflow-hidden rounded-[32px] p-8 text-center">
            {res.rank <= 3 && <Confetti />}
            <div className="aurora !opacity-30"><i /><i /><i /></div>
            <div className="relative">
              <Trophy className="mx-auto size-10 text-accent" />
              <div className="mt-4 text-sm text-muted">{t.yourScore}</div>
              <div className="display text-grad mt-1 font-mono text-6xl font-black"><Counter value={res.score} lang={lang} digits={c.metric === "rmse" ? 2 : 4} /></div>
              <div className="mt-3 text-lg font-semibold">{t.rank(nf(lang, res.rank), nf(lang, res.total))}</div>
              <div className="mt-1 text-sm text-muted">{t.best}: {fmtScore(lang, res.best)}</div>
              {res.rank <= 3 && <p className="mt-4 font-semibold text-ok">{t.podium}</p>}
              <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <button onClick={onView} className="btn btn-primary">{t.view}</button>
                <button onClick={() => { setRes(undefined); setFile(null); }} className="btn btn-ghost">{t.again}</button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={send} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass space-y-5 rounded-[32px] p-6 sm:p-8">
            <div>
              <label htmlFor="team" className="mb-2 block text-sm font-semibold">{t.team}</label>
              <input id="team" value={team} onChange={(e) => setTeam(e.target.value)} maxLength={40} placeholder={t.teamPh} aria-invalid={err?.field === "team"}
                className="h-12 w-full rounded-2xl border border-line bg-solid px-4 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15" />
              {msg("team")}
            </div>
            <div>
              <label onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={drop}
                className={`press flex cursor-pointer flex-col items-center gap-2 rounded-3xl border-2 border-dashed p-8 text-center transition-all focus-within:ring-4 focus-within:ring-accent/20 ${drag ? "scale-[1.02] border-accent bg-accent/10" : file ? "border-ok/60 bg-ok/5" : "border-line hover:border-accent/50"}`}>
                <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                {file ? <FileCheck className="size-9 text-ok" /> : <CloudUpload className={`size-9 ${drag ? "text-accent" : "text-muted"}`} />}
                <span className="font-semibold">{file ? file.name : t.drop}</span>
                <span className="text-xs text-muted">{file ? `${nf(lang, Math.ceil(file.size / 1024))} KB` : t.browse}</span>
              </label>
              {msg("file")}
            </div>
            {c.kind === "private" && (
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-accent/8 p-4 text-sm leading-6">
                <input type="checkbox" checked={nda} onChange={(e) => setNda(e.target.checked)} className="mt-1 size-4 accent-[var(--accent)]" />
                <span><Lock className="inline size-3.5 text-accent" /> {t.nda}</span>
              </label>
            )}
            {msg("form")}
            <button disabled={busy} className="btn btn-primary w-full py-3.5">
              {busy ? <><LoaderCircle className="size-4 animate-spin" />{t.sending}</> : <><CloudUpload className="size-4" />{t.send}</>}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

