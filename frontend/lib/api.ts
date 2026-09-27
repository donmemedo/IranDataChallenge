import { notFound } from "next/navigation";

export type Kind = "public" | "private" | "academic";
export type Metric = "accuracy" | "macro_f1" | "rmse";
export type Challenge = {
  slug: string; kind: Kind; sector: string; metric: Metric; prize: number; higher_better: boolean;
  days_left: number; deadline: string; participants: number; teams: number;
  org_fa: string; org_en: string; title_fa: string; title_en: string; summary_fa: string; summary_en: string;
};
export type Detail = Challenge & { desc_fa: string; desc_en: string; features: string[]; rows: number; start: string; top: number | null };
export type Row = { rank: number; team: string; score: number; entries: number; last: string };
export type Stats = { members: number; challenges: number; submissions: number; prize_pool: number; organizations: number };

// Server-side only; the browser goes through the /api rewrite in next.config.ts.
export async function api<T>(path: string): Promise<T> {
  const r = await fetch(`${process.env.API_URL ?? "http://localhost:8000"}/api${path}`, { cache: "no-store" });
  if (r.status === 404) notFound();
  if (!r.ok) throw new Error(`API ${r.status} ${path}`);
  return r.json();
}
