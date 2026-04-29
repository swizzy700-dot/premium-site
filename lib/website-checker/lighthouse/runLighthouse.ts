function normalizeUrl(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function isProbablyWebUrl(url: string) {
  try {
    const u = new URL(url);
    return Boolean(u.hostname) && u.hostname.includes(".");
  } catch {
    return false;
  }
}

export async function runLighthouseAudit(params: { url: string }) {
  const url = normalizeUrl(params.url);
  if (!isProbablyWebUrl(url)) {
    throw new Error("Invalid URL. Please provide a valid website URL.");
  }

  // Load Lighthouse dependencies at runtime to avoid Turbopack bundling issues.
  // Using eval('require') prevents Next from trying to statically bundle these modules.
  const req = eval("require") as unknown as (id: string) => unknown;
  const lighthouseMod = req("lighthouse") as unknown;
  const chromeLauncherMod = req("chrome-launcher") as unknown;

  const lighthouseDefault = (lighthouseMod as { default?: unknown }).default;
  const lighthouse = typeof lighthouseDefault === "function" ? lighthouseDefault : lighthouseMod;

  if (typeof lighthouse !== "function") {
    throw new Error("Lighthouse runner is not a function.");
  }

  const chromeLauncherDefault = (chromeLauncherMod as { default?: unknown }).default ?? chromeLauncherMod;
  const chromeLauncher = chromeLauncherDefault as unknown as {
    launch: (opts: { chromeFlags: string[] }) => Promise<{ port: number; kill: () => Promise<void> }>;
  };

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
    const lighthouseRunner = lighthouse as unknown as (u: string, opts: Record<string, unknown>) => Promise<{
      lhr: unknown;
    }>;

    const result = await lighthouseRunner(url, {
      port: chrome.port,
      output: "json",
      logLevel: "error",
      onlyCategories: ["performance", "seo", "accessibility", "best-practices"],
      // Desktop-first for conversion UX; can be extended later.
      emulatedFormFactor: "desktop",
    });

    return result.lhr;
  } finally {
    await chrome.kill();
  }
}

