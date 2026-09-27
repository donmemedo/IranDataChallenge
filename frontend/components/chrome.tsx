"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type MouseEvent, type ReactNode } from "react";
import { MotionConfig, motion } from "motion/react";
import { Building, House, Languages, Moon, Sun, Trophy } from "lucide-react";
import { dict, type Lang } from "@/lib/i18n";

export const themeScript = `try{var t=localStorage.getItem("theme");document.documentElement.dataset.theme=t||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch(e){}`;

export function Providers({ children }: { children: ReactNode }) {
  // One listener drives every .spot card's pointer spotlight.
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const el = (e.target as Element).closest?.<HTMLElement>(".spot");
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--x", `${e.clientX - r.left}px`);
      el.style.setProperty("--y", `${e.clientY - r.top}px`);
    };
    document.addEventListener("pointermove", move, { passive: true });
    return () => document.removeEventListener("pointermove", move);
  }, []);
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

export function Logo({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset=".55" stopColor="var(--accent-2)" />
          <stop offset="1" stopColor="var(--accent-3)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#lg)" />
      <path d="M8 22.5v-4M13 22.5v-8M18 22.5v-5.5M23 22.5V9.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="23" cy="9.5" r="2.6" fill="#fff" />
    </svg>
  );
}

const links = (lang: Lang) => {
  const t = dict[lang].nav;
  return [
    { href: `/${lang}`, label: t.home, icon: House, exact: true },
    { href: `/${lang}/challenges`, label: t.challenges, icon: Trophy },
    { href: `/${lang}/business`, label: t.business, icon: Building },
  ];
};
const useActive = () => {
  const path = usePathname();
  return (href: string, exact?: boolean) => (exact ? path === href : path.startsWith(href));
};
const spring = { type: "spring", bounce: 0.15, duration: 0.45 } as const;

function toggleTheme(e: MouseEvent) {
  const root = document.documentElement;
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  const apply = () => {
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch {}
  };
  if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) return apply();
  const { clientX: x, clientY: y } = e;
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  document.startViewTransition(apply).ready.then(() =>
    root.animate(
      { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 600, easing: "cubic-bezier(.2,.8,.2,1)", pseudoElement: "::view-transition-new(root)" },
    ),
  );
}

export function Header({ lang }: { lang: Lang }) {
  const t = dict[lang];
  const path = usePathname();
  const active = useActive();
  const other = lang === "fa" ? "en" : "fa";
  return (
    <header className="fixed inset-x-3 top-3 z-50 mx-auto max-w-5xl pt-[env(safe-area-inset-top)]">
      <nav className="glass flex h-14 items-center gap-2 rounded-full bg-solid/70 ps-2 pe-2 md:ps-3">
        <Link href={`/${lang}`} className="press flex items-center gap-2 rounded-full pe-2">
          <Logo />
          <span className="text-[15px] font-bold whitespace-nowrap">{t.brand}</span>
        </Link>
        <div className="mx-auto hidden items-center gap-1 md:flex">
          {links(lang).map((l) => (
            <Link key={l.href} href={l.href} className="press relative rounded-full px-4 py-2 text-sm font-medium">
              {active(l.href, l.exact) && <motion.span layoutId="nav-pill" transition={spring} className="absolute inset-0 rounded-full bg-fg/[.07] dark:bg-white/10" />}
              <span className="relative">{l.label}</span>
            </Link>
          ))}
        </div>
        <div className="ms-auto flex items-center gap-1 md:ms-0">
          <Link href={path.replace(/^\/(fa|en)/, `/${other}`)} lang={other} className="press flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium hover:bg-fg/5" aria-label={t.switchLang}>
            <Languages className="size-4" />
            <span className="hidden sm:inline">{t.switchLang}</span>
          </Link>
          <button onClick={toggleTheme} aria-label={t.theme} className="press grid size-10 place-items-center rounded-full hover:bg-fg/5">
            <Sun className="size-[18px] dark:hidden" />
            <Moon className="hidden size-[18px] dark:block" />
          </button>
        </div>
      </nav>
    </header>
  );
}

export function TabBar({ lang }: { lang: Lang }) {
  const active = useActive();
  return (
    <nav className="fixed inset-x-3 bottom-3 z-50 md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="glass mx-auto flex max-w-sm justify-around rounded-[28px] bg-solid/75 p-1.5">
        {links(lang).map(({ href, label, icon: Icon, exact }) => {
          const on = active(href, exact);
          return (
            <Link key={href} href={href} className={`press relative flex flex-1 flex-col items-center gap-0.5 rounded-3xl py-2 text-[11px] font-medium transition-colors ${on ? "text-accent" : "text-muted"}`}>
              {on && <motion.span layoutId="tab-pill" transition={spring} className="absolute inset-0 rounded-3xl bg-accent/10" />}
              <Icon className="relative size-[22px]" strokeWidth={on ? 2.4 : 1.8} />
              <span className="relative">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Footer({ lang }: { lang: Lang }) {
  const t = dict[lang];
  const year = new Intl.DateTimeFormat(lang === "fa" ? "fa-IR" : "en-US", { year: "numeric" }).format(new Date());
  return (
    <footer className="mx-auto mt-24 max-w-6xl px-5 pb-32 md:pb-12">
      <div className="flex flex-col gap-6 border-t border-line pt-8 text-sm text-muted md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Logo className="size-7" />
          <div>
            <div className="font-semibold text-fg">{t.brand}</div>
            <div>{t.tagline}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-5">
          {links(lang).map((l) => <Link key={l.href} href={l.href} className="hover:text-fg">{l.label}</Link>)}
        </div>
        <div>© {year} · {t.footer.made}</div>
      </div>
    </footer>
  );
}
