import type { LighthouseScoreKey } from "./types";
export type ParsedLighthouse = {
    scores: Record<LighthouseScoreKey, number>;
    auditsById: Record<string, unknown>;
    auditsByAuditRef: Record<LighthouseScoreKey, Array<{
        id: string;
        score: number | undefined;
    }>>;
    auditsRaw: unknown;
};
export declare function parseLhrForClient(params: {
    lhr: unknown;
}): {
    scores: Record<LighthouseScoreKey, number>;
    auditsById: Record<string, unknown>;
    auditsByAuditRef: Record<LighthouseScoreKey, {
        id: string;
        score: number | undefined;
    }[]>;
    auditsRaw: object;
};
//# sourceMappingURL=parseLighthouse.d.ts.map