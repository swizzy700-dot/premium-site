import type { LighthouseAdminAudit } from "./types";
import type { ParsedLighthouse } from "./parseLighthouse";
export declare function scoreToLabel(score: number): "Excellent" | "Good" | "Needs Improvement" | "Poor";
export declare function scoreToColor(score: number): "green" | "yellow" | "red";
export declare function interpretLighthouse(params: {
    url: string;
    businessName?: string;
    generatedAt: number;
    parsed: ParsedLighthouse;
    rawLhr: unknown;
}): LighthouseAdminAudit;
//# sourceMappingURL=interpretLighthouse.d.ts.map