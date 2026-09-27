"use client";
import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CircleCheck, LoaderCircle, Send } from "lucide-react";
import { dict, nf, type Lang } from "@/lib/i18n";
import { Segmented } from "./fx";

export function HowItWorks({ lang }: { lang: Lang }) {
  const t = dict[lang].how;
  const [who, setWho] = useState<"org" | "expert">("org");
  return (
    <div>
      <div className="flex justify-center">
        <Segmented id="how" value={who} onChange={setWho} items={[["org", t.tabs.org], ["expert", t.tabs.expert]]} />
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {t[who].map(([title, body], i) => (
          <motion.div key={who + i} initial={{ opacity: 0, y: 16, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ type: "spring", bounce: 0, duration: 0.6, delay: i * 0.07 }} className="spot glass relative rounded-[28px] p-6">
            <div className="text-grad font-mono text-5xl font-black opacity-90">{nf(lang, i + 1)}</div>
            <h3 className="title mt-4 text-lg font-bold">{title}</h3>
            <p className="mt-2 text-sm leading-7 text-muted">{body}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

const field = "h-12 w-full rounded-2xl border border-line bg-solid px-4 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15";

export function LeadForm({ lang }: { lang: Lang }) {
  const b = dict[lang].biz;
  const t = b.form;
  const [state, setState] = useState<"idle" | "busy" | "ok" | "err" | "invalid">("idle");
  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) return setState("invalid");
    setState("busy");
    try {
      const r = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      setState(r.ok ? "ok" : r.status === 422 ? "invalid" : "err");
    } catch { setState("err"); }
  }
  return (
    <div className="glass relative overflow-hidden rounded-[32px] p-6 sm:p-10">
      <AnimatePresence mode="wait">
        {state === "ok" ? (
          <motion.div key="ok" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", bounce: 0.3, duration: 0.6 }} className="py-10 text-center">
            <CircleCheck className="mx-auto size-14 text-ok" />
            <h3 className="title mt-4 text-2xl font-bold">{t.ok}</h3>
            <p className="mt-2 text-muted">{t.okSub}</p>
            <button onClick={() => setState("idle")} className="btn btn-ghost mt-6">{t.again}</button>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={send} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <h2 className="display text-3xl font-extrabold">{t.title}</h2>
              <p className="mt-2 text-muted">{t.sub}</p>
            </div>
            <label className="space-y-2 text-sm font-semibold">{t.name}<input name="name" required minLength={2} maxLength={80} className={field} autoComplete="name" /></label>
            <label className="space-y-2 text-sm font-semibold">{t.org}<input name="org" required minLength={2} maxLength={120} className={field} autoComplete="organization" /></label>
            <label className="space-y-2 text-sm font-semibold">{t.contact}<input name="contact" required minLength={5} maxLength={120} dir="ltr" className={`${field} text-start rtl:text-end`} autoComplete="email" /></label>
            <label className="space-y-2 text-sm font-semibold">{t.kind}
              <select name="kind" required defaultValue="private" className={field}>
                {Object.entries(b.plans).map(([k, [name]]) => <option key={k} value={k}>{name}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-sm font-semibold sm:col-span-2">{t.message}
              <textarea name="message" maxLength={2000} rows={4} className={`${field} h-auto py-3`} />
            </label>
            <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center">
              <button disabled={state === "busy"} className="btn btn-primary">
                {state === "busy" ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4 rtl:-scale-x-100" />}
                {state === "busy" ? t.sending : t.send}
              </button>
              {(state === "invalid" || state === "err") && (
                <p role="alert" className="text-sm font-medium text-accent-3">{state === "invalid" ? t.invalid : dict[lang].submit.errors.network}</p>
              )}
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
