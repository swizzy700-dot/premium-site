function asNumber(n) {
    if (typeof n === "number")
        return n;
    if (typeof n === "string") {
        const parsed = Number(n);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
}
export function parseLhrForClient(params) {
    const lhr = params.lhr;
    const categoriesRaw = lhr.categories;
    const auditsRaw = lhr.audits;
    const categories = typeof categoriesRaw === "object" && categoriesRaw !== null ? categoriesRaw : {};
    const audits = typeof auditsRaw === "object" && auditsRaw !== null ? auditsRaw : {};
    const scoreKeyMap = {
        performance: "performance",
        seo: "seo",
        accessibility: "accessibility",
        "best-practices": "best-practices",
    };
    const scores = Object.fromEntries(Object.keys(scoreKeyMap).map((key) => {
        const catName = scoreKeyMap[key];
        const catObj = typeof categories === "object" && categories !== null ? categories[catName] : undefined;
        const scoreRaw = typeof catObj === "object" && catObj !== null ? catObj.score : undefined;
        const n = typeof scoreRaw === "number" ? scoreRaw : asNumber(scoreRaw);
        // Lighthouse category scores are 0..1
        const score100 = typeof n === "number" ? Math.round(n * 100) : 0;
        return [key, score100];
    }));
    const auditsByAuditRef = Object.fromEntries(Object.keys(scoreKeyMap).map((key) => {
        const catName = scoreKeyMap[key];
        const catObj = typeof categories === "object" && categories !== null ? categories[catName] : undefined;
        const auditRefsRaw = typeof catObj === "object" && catObj !== null ? catObj.auditRefs : undefined;
        const auditRefs = Array.isArray(auditRefsRaw) ? auditRefsRaw : [];
        const refs = auditRefs
            .map((ref) => {
            if (typeof ref !== "object" || ref === null)
                return null;
            const id = ref.id;
            if (typeof id !== "string")
                return null;
            const auditObj = typeof audits === "object" && audits !== null ? audits[id] : undefined;
            const scoreRaw = typeof auditObj === "object" && auditObj !== null ? auditObj.score : undefined;
            const score = asNumber(scoreRaw);
            const score100 = typeof score === "number" ? score * 100 : undefined;
            return { id, score: typeof score100 === "number" ? score100 : undefined };
        })
            .filter((x) => x !== null);
        return [key, refs];
    }));
    return {
        scores,
        auditsById: audits,
        auditsByAuditRef,
        auditsRaw: audits,
    };
}
//# sourceMappingURL=parseLighthouse.js.map