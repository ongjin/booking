import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class PuppeteerService {
    async launchBrowser() {
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920,1080',
                '--no-zygote',
            ],
        });
        return browser;
    }

    async setupPage(browser: puppeteer.Browser) {
        const page = await browser.newPage();

        const cookies = await page.cookies();
        await page.deleteCookie(...cookies);

        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
            // Add more user agents
        ];

        await page.setExtraHTTPHeaders({
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
        });

        await page.setUserAgent(userAgents[Math.floor(Math.random() * userAgents.length)]);
        await page.setViewport({
            width: 1920,
            height: 1080,
            deviceScaleFactor: 1,
            isMobile: false,
            hasTouch: false,
            isLandscape: false,
        });

        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const resourceType = req.resourceType();
            if (['image'].includes(resourceType)) {
                req.abort();
            } else {
                req.continue();
            }
        });

        page.on('error', (err) => {
            console.error('Page error:', err);
        });

        page.on('pageerror', (pageErr) => {
            console.error('Page script error:', pageErr);
        });

        return page;
    }

    async openPageWithTimestamp(page: puppeteer.Page, url: string) {
        const urlWithTimestamp = `${url}?t=${Date.now()}`;
        await page.goto(urlWithTimestamp, { waitUntil: 'networkidle2' });
    }
}
