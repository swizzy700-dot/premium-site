/**
 * Screenshot Service for Website Previews
 * Generates visual thumbnails of analyzed websites
 */

import puppeteer from 'puppeteer-core';

export interface ScreenshotResult {
  success: boolean;
  screenshot?: string; // base64 encoded
  title?: string;
  domain?: string;
  error?: string;
}

/**
 * Capture a screenshot of a website
 */
export async function captureScreenshot(url: string): Promise<ScreenshotResult> {
  let browser;
  
  try {
    // Validate URL
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1200,800',
      ],
    });

    const page = await browser.newPage();
    
    // Set viewport (desktop size for consistent preview)
    await page.setViewport({
      width: 1200,
      height: 800,
      deviceScaleFactor: 1,
    });

    // Navigate with timeout
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Get page title
    const title = await page.title();

    // Take screenshot
    const screenshot = await page.screenshot({
      type: 'jpeg',
      quality: 80,
      encoding: 'base64',
    });

    await browser.close();

    return {
      success: true,
      screenshot,
      title,
      domain,
    };
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    
    console.error('Screenshot capture error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to capture screenshot',
    };
  }
}

/**
 * Get website metadata (title, description, favicon)
 */
export async function getWebsiteMetadata(url: string): Promise<{
  title?: string;
  description?: string;
  domain?: string;
  error?: string;
}> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WebIntel/1.0; +https://webintel.io)',
      },
    });

    if (!response.ok) {
      return { error: `HTTP ${response.status}` };
    }

    const html = await response.text();
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : undefined;
    
    // Extract description
    const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i) ||
                       html.match(/<meta[^>]*content="([^"]*)"[^>]*name="description"[^>]*>/i);
    const description = descMatch ? descMatch[1].trim() : undefined;
    
    const urlObj = new URL(url);
    
    return {
      title,
      description,
      domain: urlObj.hostname,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to fetch metadata',
    };
  }
}
