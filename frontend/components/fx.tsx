"use client";
import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { nf, type Lang } from "@/lib/i18n";

const settle = { type: "spring", bounce: 0, duration: 0.9 } as const;

/** Materializes on scroll: blur + rise, critically damped. */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ ...settle, delay }}
    >
      {children}
    </motion.div>
  );
}

export function Counter({ value, lang, digits = 0 }: { value: number; lang: Lang; digits?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!inView || reduce) return;
    const fmt = (v: number) => nf(lang, v, { maximumFractionDigits: digits, minimumFractionDigits: digits });
    const c = animate(0, value, { type: "spring", bounce: 0, duration: 1.8, onUpdate: (v) => ref.current && (ref.current.textContent = fmt(v)) });
    return () => c.stop();
  }, [inView, reduce, value, lang, digits]);
  return <span ref={ref} className="tabular-nums">{nf(lang, value, { maximumFractionDigits: digits, minimumFractionDigits: digits })}</span>;
}

/** Apple-style segmented control; the pill springs between options. */
export function Segmented<T extends string>({ id, items, value, onChange, className = "" }: {
  id: string; items: [T, ReactNode][]; value: T; onChange: (v: T) => void; className?: string;
}) {
  return (
    <div role="tablist" className={`glass inline-flex max-w-full overflow-x-auto rounded-full p-1 [scrollbar-width:none] ${className}`}>
      {items.map(([k, label]) => (
        <button key={k} role="tab" aria-selected={value === k} onClick={() => onChange(k)}
          className={`press relative shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${value === k ? "text-fg" : "text-muted hover:text-fg"}`}>
          {value === k && <motion.span layoutId={id} transition={{ type: "spring", bounce: 0.15, duration: 0.45 }} className="absolute inset-0 rounded-full bg-solid shadow-[var(--shadow)]" />}
          <span className="relative flex items-center gap-1.5">{label}</span>
        </button>
      ))}
    </div>
  );
}

/** Card that leans toward the pointer (springs, interruptible). */
export function Tilt({ children, className }: { children: ReactNode; className?: string }) {
  const x = useMotionValue(0), y = useMotionValue(0);
  const rx = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { bounce: 0, duration: 0.5 });
  const ry = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), { bounce: 0, duration: 0.5 });
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };
  return (
    <div style={{ perspective: 1000 }} onPointerMove={move} onPointerLeave={() => { x.set(0); y.set(0); }}>
      <motion.div style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }} className={className}>{children}</motion.div>
    </div>
  );
}

const COLORS = ["var(--accent)", "var(--accent-2)", "var(--accent-3)", "#ffd60a"];
export function Confetti() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {Array.from({ length: 70 }, (_, i) => (
        <motion.i key={i} className="absolute top-[40%] left-1/2 h-3 w-1.5 rounded-[2px]" style={{ background: COLORS[i % 4] }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{ x: (Math.random() - 0.5) * 1100, y: [0, -200 - Math.random() * 300, 800], rotate: Math.random() * 900, opacity: [1, 1, 0] }}
          transition={{ duration: 2 + Math.random() * 1.2, ease: [0.2, 0.7, 0.4, 1] }} />
      ))}
    </div>
  );
}
