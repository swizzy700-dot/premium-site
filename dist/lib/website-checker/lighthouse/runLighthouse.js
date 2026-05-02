function normalizeUrl(raw) {
    const trimmed = raw.trim();
    if (!trimmed)
        return "";
    if (!/^https?:\/\//i.test(trimmed))
        return `https://${trimmed}`;
    return trimmed;
}
function isProbablyWebUrl(url) {
    try {
        const u = new URL(url);
        return Boolean(u.hostname) && u.hostname.includes(".");
    }
    catch {
        return false;
    }
}
export async function runLighthouseAudit(params) {
    const url = normalizeUrl(params.url);
    if (!isProbablyWebUrl(url)) {
        throw new Error("Invalid URL. Please provide a valid website URL.");
    }
    // Load Lighthouse dependencies at runtime to avoid Turbopack bundling issues.
    // Using eval('require') prevents Next from trying to statically bundle these modules.
    const req = eval("require");
    const lighthouseMod = req("lighthouse");
    const chromeLauncherMod = req("chrome-launcher");
    const lighthouseDefault = lighthouseMod.default;
    const lighthouse = typeof lighthouseDefault === "function" ? lighthouseDefault : lighthouseMod;
    if (typeof lighthouse !== "function") {
        throw new Error("Lighthouse runner is not a function.");
    }
    const chromeLauncherDefault = chromeLauncherMod.default ?? chromeLauncherMod;
    const chromeLauncher = chromeLauncherDefault;
    const chrome = await chromeLauncher.launch({
        // Headless Chrome flags for CI-like environments.
        chromeFlags: [
            "--headless=new",
            "--disable-gpu",
            "--no-sandbox",
            "--disable-dev-shm-usage",
        ],
    });
    try {
        const lighthouseRunner = lighthouse;
        const result = await lighthouseRunner(url, {
            port: chrome.port,
            output: "json",
            logLevel: "error",
            onlyCategories: ["performance", "seo", "accessibility", "best-practices"],
            // Desktop-first for conversion UX; can be extended later.
            emulatedFormFactor: "desktop",
        });
        return result.lhr;
    }
    finally {
        await chrome.kill();
    }
}
//# sourceMappingURL=runLighthouse.js.map