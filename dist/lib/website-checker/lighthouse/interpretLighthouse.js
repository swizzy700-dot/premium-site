function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}
export function scoreToLabel(score) {
    if (score >= 90)
        return "Excellent";
    if (score >= 75)
        return "Good";
    if (score >= 50)
        return "Needs Improvement";
    return "Poor";
}
export function scoreToColor(score) {
    if (score >= 90)
        return "green";
    if (score >= 75)
        return "green";
    if (score >= 50)
        return "yellow";
    return "red";
}
function severityFromScore(score) {
    if (score >= 75)
        return "info";
    if (score >= 50)
        return "warning";
    return "critical";
}
function friendlyAudit(params) {
    const { auditId, title, score, category } = params;
    const baseTitle = title?.trim() ? title.trim() : auditId;
    const mapped = {
        "largest-contentful-paint": {
            title: "Main content appears too slowly",
            description: "Your primary content takes longer than it should to load and feel responsive.",
            defaultSteps: [
                "Reduce the amount of work needed before first content loads.",
                "Optimize key assets (images, fonts, and scripts) for faster initial delivery.",
                "Prioritize the fastest path to your main headline and primary CTA.",
            ],
        },
        "cumulative-layout-shift": {
            title: "Layout shifts make pages feel unstable",
            description: "Elements move while loading, which makes the experience harder to scan and trust.",
            defaultSteps: [
                "Reserve space for images, embeds, and dynamic content.",
                "Ensure fonts load predictably to avoid text reflow.",
                "Minimize late-loading UI changes near important CTAs.",
            ],
        },
        "total-blocking-time": {
            title: "JavaScript blocks user interaction",
            description: "The page can feel unresponsive while scripts work in the background.",
            defaultSteps: [
                "Reduce and defer non-critical scripts.",
                "Optimize code to shorten the time the main thread is busy.",
                "Ensure interactive elements respond quickly when users scroll.",
            ],
        },
        "render-blocking-resources": {
            title: "Critical resources delay the first view",
            description: "Some resources are slowing down the initial rendering of your page.",
            defaultSteps: [
                "Defer or remove non-critical resources.",
                "Minimize CSS/JS impact on the critical rendering path.",
                "Load secondary features after the first meaningful paint.",
            ],
        },
        redirects: {
            title: "Redirects add extra load time",
            description: "Redirect chains can slow the request path and delay the experience.",
            defaultSteps: ["Fix redirect chains so users land directly on the final URL.", "Ensure canonical URLs are consistent."],
        },
        "meta-description": {
            title: "Missing or weak meta description",
            description: "Your search snippet may not clearly communicate value, which reduces clicks from high-intent visitors.",
            defaultSteps: [
                "Write a clear, benefit-led meta description for key landing pages.",
                "Align wording with the search intent your audience cares about.",
                "Ensure each page has a unique description that matches the offer.",
            ],
        },
    };
    const mappedEntry = mapped[auditId];
    if (mappedEntry) {
        return {
            title: mappedEntry.title,
            description: mappedEntry.description,
            steps: mappedEntry.defaultSteps,
        };
    }
    // For unknown audits, avoid technical detail. Provide a safe generic fix direction.
    return {
        title: baseTitle,
        description: category === "seo"
            ? "Your page could be more discoverable for high-intent searches."
            : category === "accessibility"
                ? "Your experience may be harder to use for some visitors."
                : category === "best-practices"
                    ? "There are quality or reliability issues that can reduce trust and performance."
                    : "There are performance bottlenecks that can slow down your user experience.",
        steps: score == null
            ? ["Prioritize the highest-impact fixes first (speed, clarity, and conversion flow)."]
            : [
                "Focus on the largest leverage improvements first.",
                "Validate the outcome after implementing changes.",
            ],
    };
}
function getMetric(params) {
    const audit = params.audits[params.auditId];
    if (!audit)
        return null;
    return params.format(audit);
}
export function interpretLighthouse(params) {
    const { url, businessName, generatedAt, parsed, rawLhr } = params;
    const scores = parsed.scores;
    const worstKey = Object.keys(scores).sort((a, b) => scores[a] - scores[b])[0];
    const scoreCards = Object.keys(scores).reduce((acc, key) => {
        const s = clamp(scores[key] ?? 0, 0, 100);
        const label = scoreToLabel(s);
        const color = scoreToColor(s);
        const shortExplanation = label === "Excellent"
            ? "Strong conversion experience potential."
            : label === "Good"
                ? "A solid foundation with room to improve."
                : label === "Needs Improvement"
                    ? "Fixable friction points are likely reducing lead conversion."
                    : "Significant issues are likely holding back qualified inquiries.";
        acc[key] = { score: s, label, color, shortExplanation };
        return acc;
    }, {});
    const worstScore = scoreCards[worstKey]?.score ?? 0;
    const lcp = getMetric({
        audits: parsed.auditsById,
        auditId: "largest-contentful-paint",
        format: (audit) => {
            const auditObj = audit;
            const formatted = typeof auditObj?.displayValue === "string" ? auditObj.displayValue : "";
            const numericValue = typeof auditObj?.numericValue === "number" ? auditObj.numericValue : undefined;
            // LCP: lower is better. Thresholds (ms) are based on common web vitals guidance.
            const severity = typeof numericValue === "number"
                ? numericValue <= 2_500
                    ? "good"
                    : numericValue <= 4_000
                        ? "warning"
                        : "bad"
                : formatted.includes("s")
                    ? "warning"
                    : "warning";
            if (!formatted)
                return null;
            return { formatted, severity };
        },
    });
    const cls = getMetric({
        audits: parsed.auditsById,
        auditId: "cumulative-layout-shift",
        format: (audit) => {
            const auditObj = audit;
            const formatted = typeof auditObj?.displayValue === "string" ? auditObj.displayValue : "";
            const numericValue = typeof auditObj?.numericValue === "number" ? auditObj.numericValue : undefined;
            const severity = typeof numericValue === "number"
                ? numericValue <= 0.1
                    ? "good"
                    : numericValue <= 0.25
                        ? "warning"
                        : "bad"
                : "warning";
            if (!formatted)
                return null;
            return { formatted, severity };
        },
    });
    const tbt = getMetric({
        audits: parsed.auditsById,
        auditId: "total-blocking-time",
        format: (audit) => {
            const auditObj = audit;
            const formatted = typeof auditObj?.displayValue === "string" ? auditObj.displayValue : "";
            const numericValue = typeof auditObj?.numericValue === "number" ? auditObj.numericValue : undefined;
            const severity = typeof numericValue === "number"
                ? numericValue <= 200
                    ? "good"
                    : numericValue <= 600
                        ? "warning"
                        : "bad"
                : "warning";
            if (!formatted)
                return null;
            return { formatted, severity };
        },
    });
    const issuesFound = [];
    const recommendations = [];
    const categoryKeys = ["performance", "seo", "accessibility", "best-practices"];
    // Build issues/recommendations from the auditRefs list for each category.
    // We avoid raw audit ids or verbose descriptions in the client view.
    for (const key of categoryKeys) {
        const refs = parsed.auditsByAuditRef[key] ?? [];
        const sorted = refs
            .filter((r) => typeof r.score === "number")
            .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
            .slice(0, 3);
        const labelScore = scoreCards[key].score;
        const baseSeverity = severityFromScore(labelScore);
        for (const ref of sorted) {
            const audit = parsed.auditsById[ref.id];
            const friendly = friendlyAudit({
                auditId: ref.id,
                title: typeof audit?.title === "string" ? audit.title : undefined,
                score: typeof ref.score === "number" ? ref.score : undefined,
                category: key,
            });
            const severity = ref.score != null ? severityFromScore(ref.score) : baseSeverity;
            issuesFound.push({
                title: friendly.title,
                description: friendly.description,
                category: key,
                severity,
            });
            // Create one recommendation per unique category-issue combination (dedupe by title).
            const existing = recommendations.some((r) => r.title === friendly.title);
            if (!existing) {
                recommendations.push({
                    title: friendly.title,
                    explanation: key === worstKey
                        ? "This is likely your biggest leverage point. Fixing it helps your site convert more reliably."
                        : "This improves the overall experience and supports better conversion outcomes.",
                    steps: friendly.steps,
                    category: key,
                });
            }
        }
    }
    const brandContext = businessName?.trim() ? ` for ${businessName.trim()}` : "";
    const overallExplanation = worstScore >= 90
        ? `Your site is in a strong position${brandContext}. You’re likely already converting well; targeted refinements can push results further.`
        : worstScore >= 75
            ? `Your site has a solid foundation${brandContext}. A focused set of improvements can noticeably improve performance, clarity, and lead conversion.`
            : worstScore >= 50
                ? `Your site shows clear friction points${brandContext}. Prioritizing a few conversion-focused fixes can reduce drop-off and improve qualified inquiries.`
                : `Your site is likely losing qualified visitors${brandContext}. Fixing the largest leverage issues will improve speed, clarity, and overall trust.`;
    const client = {
        url,
        businessName,
        generatedAt,
        source: "pagespeed_insights",
        scores: scoreCards,
        overallExplanation,
        keyDiagnostics: {
            ...(lcp ? { lcp: { formatted: lcp.formatted, severity: lcp.severity } } : {}),
            ...(cls ? { cls: { formatted: cls.formatted, severity: cls.severity } } : {}),
            ...(tbt ? { tbt: { formatted: tbt.formatted, severity: tbt.severity } } : {}),
        },
        issuesFound,
        recommendations: recommendations.slice(0, 6),
    };
    const admin = { client, rawLhr };
    return admin;
}
//# sourceMappingURL=interpretLighthouse.js.map