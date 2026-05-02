/**
 * Dedicated Lighthouse Worker
 * Runs outside Next bundling context to avoid @paulirish/trace_engine errors
 */

import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { logger } from '../utils/logger';
import { AuditError, ErrorCodes } from '../utils/errorHandler';

export interface DeviceAuditResult {
  performance: number;
  seo: number;
  accessibility: number;
  bestPractices: number;
  rawLhr: unknown;
  error?: string;
}

export interface LighthouseResult {
  mobile: DeviceAuditResult | null;
  desktop: DeviceAuditResult | null;
  status: 'complete' | 'partial' | 'failed';
}

// Extended timeouts for production stability
const MOBILE_TIMEOUT = 90000;
const DESKTOP_TIMEOUT = 120000;

class LighthouseWorker {
  /**
   * Run both mobile and desktop audits in parallel
   */
  async runAudit(url: string): Promise<LighthouseResult> {
    logger.info(`Starting parallel Lighthouse audits for: ${url}`);
    const startTime = Date.now();

    const [mobileResult, desktopResult] = await Promise.allSettled([
      this.runDeviceAudit(url, 'mobile', MOBILE_TIMEOUT),
      this.runDeviceAudit(url, 'desktop', DESKTOP_TIMEOUT),
    ]);

    const duration = Date.now() - startTime;

    const mobile = mobileResult.status === 'fulfilled' ? mobileResult.value : null;
    const desktop = desktopResult.status === 'fulfilled' ? desktopResult.value : null;

    if (mobileResult.status === 'rejected') {
      logger.error(`Mobile audit failed`, { url, error: (mobileResult.reason as Error).message });
    }
    if (desktopResult.status === 'rejected') {
      logger.error(`Desktop audit failed`, { url, error: (desktopResult.reason as Error).message });
    }

    let status: 'complete' | 'partial' | 'failed';
    if (mobile && desktop) status = 'complete';
    else if (mobile || desktop) status = 'partial';
    else status = 'failed';

    logger.info(`Lighthouse audits completed`, {
      url, duration, status,
      mobile: mobile ? 'success' : 'failed',
      desktop: desktop ? 'success' : 'failed',
    });

    return { mobile, desktop, status };
  }

  private async runDeviceAudit(
    url: string,
    device: 'mobile' | 'desktop',
    timeoutMs: number
  ): Promise<DeviceAuditResult> {
    const startTime = Date.now();
    let chrome: chromeLauncher.LaunchedChrome | null = null;

    try {
      logger.info(`Starting ${device} Lighthouse audit`, { url, timeout: timeoutMs });

      const chromeFlags = [
        '--headless', '--no-sandbox', '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', '--disable-gpu', '--disable-dev-tools',
        '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
      ];

      chrome = await chromeLauncher.launch({ chromeFlags, logLevel: 'error' });

      // Desktop runs fewer categories to reduce timeout risk
      const categories = device === 'desktop'
        ? ['performance', 'seo']
        : ['performance', 'seo', 'accessibility', 'best-practices'];

      const options = {
        logLevel: 'error' as const,
        output: 'json' as const,
        onlyCategories: categories as string[],
        port: chrome.port,
        maxWaitForLoad: timeoutMs,
        formFactor: device,
        screenEmulation: {
          mobile: device === 'mobile',
          width: device === 'mobile' ? 390 : 1350,
          height: device === 'mobile' ? 844 : 940,
          deviceScaleFactor: device === 'mobile' ? 3 : 1,
          disabled: false,
        },
        emulatedUserAgent: device === 'mobile'
          ? 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36'
          : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      };

      const runnerResult = await Promise.race([
        lighthouse(url, options),
        this.createTimeoutPromise(timeoutMs, device),
      ]);

      if (!runnerResult) throw new Error('Lighthouse returned no results');

      const lhr = runnerResult.lhr;
      const performance = Math.round((lhr.categories.performance?.score ?? 0) * 100);
      const seo = Math.round((lhr.categories.seo?.score ?? 0) * 100);
      const accessibility = Math.round((lhr.categories.accessibility?.score ?? 0) * 100);
      const bestPractices = Math.round((lhr.categories['best-practices']?.score ?? 0) * 100);

      await this.killChrome(chrome);

      return { performance, seo, accessibility, bestPractices, rawLhr: lhr };
    } catch (error) {
      await this.killChrome(chrome);
      throw error;
    }
  }

  private createTimeoutPromise(ms: number, device: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${device} timeout`)), ms);
    });
  }

  private async killChrome(chrome: chromeLauncher.LaunchedChrome | null): Promise<void> {
    if (!chrome) return;
    try {
      await chrome.kill();
    } catch {
      try {
        const pid = (chrome as unknown as { pid?: number }).pid;
        if (pid) process.kill(pid, 'SIGKILL');
      } catch {}
    }
  }

  /**
   * Calculate overall score from Lighthouse results
   * Uses mobile as primary, falls back to desktop
   */
  calculateOverallScore(result: LighthouseResult): {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
    overall: number;
    grade: string;
  } {
    const primary = result.mobile ?? result.desktop;

    if (!primary) {
      return {
        performance: 0,
        seo: 0,
        accessibility: 0,
        bestPractices: 0,
        overall: 0,
        grade: 'F',
      };
    }

    const { performance, seo, accessibility, bestPractices } = primary;

    // Weighted average
    const overall = Math.round(
      performance * 0.4 +
      seo * 0.2 +
      accessibility * 0.25 +
      bestPractices * 0.15
    );

    // Calculate grade
    let grade: string;
    if (overall >= 90) grade = 'A';
    else if (overall >= 80) grade = 'B';
    else if (overall >= 70) grade = 'C';
    else if (overall >= 60) grade = 'D';
    else grade = 'F';

    return {
      performance,
      seo,
      accessibility,
      bestPractices,
      overall,
      grade,
    };
  }

  /**
   * Get the best available result (mobile preferred, then desktop)
   */
  getBestResult(result: LighthouseResult): DeviceAuditResult | null {
    return result.mobile ?? result.desktop ?? null;
  }
}

// Export singleton
export const lighthouseWorker = new LighthouseWorker();

// CLI support for standalone execution
if (require.main === module) {
  const url = process.argv[2];
  if (!url) {
    console.error('Usage: npx ts-node workers/lighthouse.worker.ts <url>');
    process.exit(1);
  }

  lighthouseWorker.runAudit(url)
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('Audit failed:', error);
      process.exit(1);
    });
}
