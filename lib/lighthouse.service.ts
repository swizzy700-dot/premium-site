import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { logger } from '../utils/logger.js';
import { AuditError, ErrorCodes } from '../utils/errorHandler.js';

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

export interface LighthouseScores {
  performance: number;
  seo: number;
  accessibility: number;
  bestPractices: number;
  overall: number;
  grade: string;
}

// Extended timeouts for production stability
const MOBILE_TIMEOUT = 90000; // 90 seconds for mobile
const DESKTOP_TIMEOUT = 120000; // 120 seconds for desktop (slower)

export class LighthouseService {
  /**
   * Run both mobile and desktop audits in parallel with independent failure handling
   */
  async runAudit(url: string): Promise<LighthouseResult> {
    logger.info(`Starting parallel Lighthouse audits for: ${url}`);
    const startTime = Date.now();

    // Run both audits in parallel using Promise.allSettled
    const [mobileResult, desktopResult] = await Promise.allSettled([
      this.runDeviceAudit(url, 'mobile', MOBILE_TIMEOUT),
      this.runDeviceAudit(url, 'desktop', DESKTOP_TIMEOUT),
    ]);

    const duration = Date.now() - startTime;

    // Process results
    const mobile = mobileResult.status === 'fulfilled' ? mobileResult.value : null;
    const desktop = desktopResult.status === 'fulfilled' ? desktopResult.value : null;

    // Log errors but don't throw
    if (mobileResult.status === 'rejected') {
      logger.error(`Mobile audit failed`, { url, error: (mobileResult.reason as Error).message });
    }
    if (desktopResult.status === 'rejected') {
      logger.error(`Desktop audit failed`, { url, error: (desktopResult.reason as Error).message });
    }

    // Determine overall status
    let status: 'complete' | 'partial' | 'failed';
    if (mobile && desktop) {
      status = 'complete';
    } else if (mobile || desktop) {
      status = 'partial';
    } else {
      status = 'failed';
    }

    logger.info(`Lighthouse audits completed`, {
      url,
      duration,
      status,
      mobile: mobile ? 'success' : 'failed',
      desktop: desktop ? 'success' : 'failed',
    });

    return {
      mobile,
      desktop,
      status,
    };
  }

  /**
   * Run a single device audit with proper timeout and cleanup
   */
  private async runDeviceAudit(
    url: string,
    device: 'mobile' | 'desktop',
    timeoutMs: number
  ): Promise<DeviceAuditResult> {
    const startTime = Date.now();
    let chrome: chromeLauncher.LaunchedChrome | null = null;

    try {
      logger.info(`Starting ${device} Lighthouse audit`, { url, timeout: timeoutMs });

      // Launch Chrome with device-specific flags
      const chromeFlags = [
        '--headless',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-dev-tools',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
      ];

      chrome = await chromeLauncher.launch({
        chromeFlags,
        logLevel: 'error',
      });

      // Device-specific options
      const categories = device === 'desktop'
        ? ['performance', 'seo'] // Optimized: fewer categories for desktop to reduce timeout risk
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
          ? 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
          : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      };

      // Run Lighthouse with timeout protection
      const runnerResult = await Promise.race([
        lighthouse(url, options),
        this.createTimeoutPromise(timeoutMs, device),
      ]);

      if (!runnerResult) {
        throw new Error('Lighthouse returned no results');
      }

      const lhr = runnerResult.lhr;

      // Extract scores
      const performance = Math.round((lhr.categories.performance?.score ?? 0) * 100);
      const seo = Math.round((lhr.categories.seo?.score ?? 0) * 100);
      const accessibility = Math.round((lhr.categories.accessibility?.score ?? 0) * 100);
      const bestPractices = Math.round((lhr.categories['best-practices']?.score ?? 0) * 100);

      const duration = Date.now() - startTime;
      logger.info(`${device} Lighthouse audit completed`, { url, duration, performance, seo });

      // Cleanup Chrome immediately
      await this.killChrome(chrome);
      chrome = null;

      return {
        performance,
        seo,
        accessibility,
        bestPractices,
        rawLhr: lhr,
      };
    } catch (error) {
      // Ensure Chrome is killed even on error
      await this.killChrome(chrome);
      chrome = null;

      if (error instanceof Error && error.message.includes('timeout')) {
        throw new AuditError({
          message: `${device} audit timeout after ${timeoutMs}ms`,
          code: ErrorCodes.AUDIT_TIMEOUT,
          retryable: false,
          cause: error,
        });
      }

      throw new AuditError({
        message: `${device} audit failed: ${(error as Error).message}`,
        code: ErrorCodes.LIGHTHOUSE_FAILED,
        retryable: true,
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Create a timeout promise that rejects after specified milliseconds
   */
  private createTimeoutPromise(ms: number, device: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${device} audit timeout after ${ms}ms`));
      }, ms);
    });
  }

  /**
   * Safely kill Chrome process
   */
  private async killChrome(chrome: chromeLauncher.LaunchedChrome | null): Promise<void> {
    if (!chrome) return;

    try {
      await chrome.kill();
      logger.debug('Chrome process killed successfully');
    } catch (error) {
      // Chrome might already be dead, that's okay
      logger.debug('Chrome kill attempted (may already be dead)', { error: (error as Error).message });

      // Force kill if needed
      try {
        const pid = (chrome as unknown as { pid?: number }).pid;
        if (pid && typeof process.kill === 'function') {
          process.kill(pid, 'SIGKILL');
        }
      } catch {
        // Ignore force kill errors
      }
    }
  }

  /**
   * Calculate overall score from combined mobile/desktop results
   * Uses mobile as primary for consistency
   */
  calculateOverallScore(result: LighthouseResult): LighthouseScores {
    // Prefer mobile scores, fall back to desktop if mobile failed
    const primary = result.mobile ?? result.desktop;

    if (!primary) {
      // Both failed - return zeros
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

    // Weighted average: Performance 40%, SEO 20%, Accessibility 25%, Best Practices 15%
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

export const lighthouseService = new LighthouseService();
