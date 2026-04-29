import type { LighthouseScoreKey } from "./types";

function asNumber(n: unknown) {
  if (typeof n === "number") return n;
  if (typeof n === "string") {
    const parsed = Number(n);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export type ParsedLighthouse = {
  scores: Record<LighthouseScoreKey, number>; // 0-100
  auditsById: Record<string, unknown>;
  auditsByAuditRef: Record<LighthouseScoreKey, Array<{ id: string; score: number | undefined }>>;
  auditsRaw: unknown;
};

export function parseLhrForClient(params: { lhr: unknown }) {
  const lhr = params.lhr as Record<string, unknown>;
  const categoriesRaw = (lhr as { categories?: unknown }).categories;
  const auditsRaw = (lhr as { audits?: unknown }).audits;

  const categories = typeof categoriesRaw === "object" && categoriesRaw !== null ? categoriesRaw : {};
  const audits = typeof auditsRaw === "object" && auditsRaw !== null ? auditsRaw : {};

  const scoreKeyMap: Record<LighthouseScoreKey, string> = {
    performance: "performance",
    seo: "seo",
    accessibility: "accessibility",
    "best-practices": "best-practices",
  };

  const scores = Object.fromEntries(
    (Object.keys(scoreKeyMap) as LighthouseScoreKey[]).map((key) => {
      const catName = scoreKeyMap[key];
      const catObj = typeof categories === "object" && categories !== null ? (categories as Record<string, unknown>)[catName] : undefined;
      const scoreRaw =
        typeof catObj === "object" && catObj !== null ? (catObj as Record<string, unknown>).score : undefined;
      const n = typeof scoreRaw === "number" ? scoreRaw : asNumber(scoreRaw);
      // Lighthouse category scores are 0..1
      const score100 = typeof n === "number" ? Math.round(n * 100) : 0;
      return [key, score100];
    }),
  ) as Record<LighthouseScoreKey, number>;

  const auditsByAuditRef = Object.fromEntries(
    (Object.keys(scoreKeyMap) as LighthouseScoreKey[]).map((key) => {
      const catName = scoreKeyMap[key];
      const catObj = typeof categories === "object" && categories !== null ? (categories as Record<string, unknown>)[catName] : undefined;
      const auditRefsRaw =
        typeof catObj === "object" && catObj !== null ? (catObj as Record<string, unknown>).auditRefs : undefined;

      const auditRefs = Array.isArray(auditRefsRaw) ? auditRefsRaw : [];

      const refs = auditRefs
        .map((ref) => {
          if (typeof ref !== "object" || ref === null) return null;
          const id = (ref as Record<string, unknown>).id;
          if (typeof id !== "string") return null;
          const auditObj = typeof audits === "object" && audits !== null ? (audits as Record<string, unknown>)[id] : undefined;
          const scoreRaw = typeof auditObj === "object" && auditObj !== null ? (auditObj as Record<string, unknown>).score : undefined;
          const score = asNumber(scoreRaw);
          const score100 = typeof score === "number" ? score * 100 : undefined;
          return { id, score: typeof score100 === "number" ? score100 : undefined };
        })
        .filter((x): x is { id: string; score: number | undefined } => x !== null);
      return [key, refs];
    }),
  ) as Record<LighthouseScoreKey, Array<{ id: string; score: number | undefined }>>;

  return {
    scores,
    auditsById: audits as Record<string, unknown>,
    auditsByAuditRef,
    auditsRaw: audits,
  } satisfies ParsedLighthouse;
}

