import puppeteer, { Browser, Page } from 'puppeteer';
import { logger } from '../utils/logger';
import { AuditError, ErrorCodes, detectBlockedSite } from '../utils/errorHandler';

export interface PuppeteerResult {
  html: string;
  title: string;
  url: string;
  blocked: boolean;
  emptyDom: boolean;
}

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 2;

export class PuppeteerService {
  private browser: Browser | null = null;

  async launchBrowser(): Promise<Browser> {
    try {
      logger.info('Launching Puppeteer browser');
      
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
        ],
        timeout: 60000,
      });

      logger.info('Browser launched successfully');
      return this.browser;
    } catch (error) {
      logger.error('Failed to launch browser', { error });
      throw new AuditError({
        message: 'Failed to launch browser',
        code: ErrorCodes.BROWSER_LAUNCH_FAILED,
        retryable: true,
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async loadWebsite(url: string, retryCount = 0): Promise<PuppeteerResult> {
    const startTime = Date.now();
    
    try {
      logger.info(`Loading website: ${url}`, { retryCount });

      const browser = await this.launchBrowser();
      const page = await browser.newPage();

      // Set viewport
      await page.setViewport({ width: 1920, height: 1080 });

      // Set user agent
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Navigate with timeout
      const response = await page.goto(url, {
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: DEFAULT_TIMEOUT,
      });

      // Check for blocked status
      if (response) {
        const status = response.status();
        
        if (status === 403) {
          throw new AuditError({
            message: 'Access denied (403)',
            code: ErrorCodes.URL_BLOCKED,
            retryable: false,
            statusCode: 403,
          });
        }

        if (status >= 400) {
          throw new AuditError({
            message: `HTTP ${status} error`,
            code: ErrorCodes.URL_NOT_ACCESSIBLE,
            retryable: status >= 500,
            statusCode: status,
          });
        }
      }

      // Check for captcha
      const hasCaptcha = await this.detectCaptcha(page);
      if (hasCaptcha) {
        throw new AuditError({
          message: 'Captcha detected',
          code: ErrorCodes.CAPTCHA_DETECTED,
          retryable: false,
        });
      }

      // Get page content
      const html = await page.content();
      const title = await page.title();

      // Check for empty DOM
      const emptyDom = this.isEmptyDom(html);

      const duration = Date.now() - startTime;
      logger.info(`Website loaded successfully`, { url, duration, title: title.substring(0, 100) });

      // Close page
      await page.close();

      return {
        html,
        title,
        url: page.url(),
        blocked: false,
        emptyDom,
      };
    } catch (error) {
      if (error instanceof AuditError) {
        throw error;
      }

      // Check for timeout
      if (error instanceof Error && error.message.includes('timeout')) {
        if (retryCount < MAX_RETRIES) {
          logger.warn(`Page load timeout, retrying...`, { url, retryCount });
          return this.loadWebsite(url, retryCount + 1);
        }

        throw new AuditError({
          message: 'Page load timeout',
          code: ErrorCodes.PAGE_TIMEOUT,
          retryable: false,
          cause: error,
        });
      }

      // Check for blocked site
      if (detectBlockedSite(error)) {
        throw new AuditError({
          message: 'Website blocked access',
          code: ErrorCodes.URL_BLOCKED,
          retryable: false,
          cause: error instanceof Error ? error : undefined,
        });
      }

      if (retryCount < MAX_RETRIES) {
        logger.warn(`Page load failed, retrying...`, { url, retryCount, error: (error as Error).message });
        return this.loadWebsite(url, retryCount + 1);
      }

      throw new AuditError({
        message: 'Failed to load page',
        code: ErrorCodes.PAGE_LOAD_FAILED,
        retryable: false,
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  private async detectCaptcha(page: Page): Promise<boolean> {
    const captchaIndicators = [
      'captcha',
      'recaptcha',
      'g-recaptcha',
      'hcaptcha',
      'cf-turnstile',
    ];

    for (const indicator of captchaIndicators) {
      const exists = await page.evaluate((selector) => {
        return document.querySelector(`[class*="${selector}"], [id*="${selector}"], [name*="${selector}"]`) !== null ||
               document.body.innerHTML.toLowerCase().includes(selector.toLowerCase());
      }, indicator);

      if (exists) return true;
    }

    return false;
  }

  private isEmptyDom(html: string): boolean {
    // Remove whitespace and check if there's any meaningful content
    const text = html.replace(/<[^>]*>/g, '').replace(/\s/g, '');
    return text.length < 50; // Less than 50 chars is considered empty
  }

  async close(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
        logger.info('Browser closed');
      } catch (error) {
        logger.error('Error closing browser', { error });
      }
      this.browser = null;
    }
  }
}

export const puppeteerService = new PuppeteerService();
