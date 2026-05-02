import { Browser } from 'puppeteer';
export interface PuppeteerResult {
    html: string;
    title: string;
    url: string;
    blocked: boolean;
    emptyDom: boolean;
}
export declare class PuppeteerService {
    private browser;
    launchBrowser(): Promise<Browser>;
    loadWebsite(url: string, retryCount?: number): Promise<PuppeteerResult>;
    private detectCaptcha;
    private isEmptyDom;
    close(): Promise<void>;
}
export declare const puppeteerService: PuppeteerService;
//# sourceMappingURL=puppeteer.service.d.ts.map