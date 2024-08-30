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
        await page.setViewport({ width: 1920, height: 1080 });

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
