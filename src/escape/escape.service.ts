import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { CreateEscapeDto } from './dto/create-escape.dto';
import { SelectShopUtil } from './utils/select-shop.utils';
import { SelectDateUtil } from './utils/select-date.utils';
import { SelectThemeUtil } from './utils/select-theme.utils';
import { SelectTimeUtil } from './utils/select-time.utils';

@Injectable()
export class EscapeService {
    private readonly maxDelay = Number.MAX_SAFE_INTEGER; // Extremely long delay
    constructor(
        private readonly selectShopUtil: SelectShopUtil,
        private readonly selectDateUtil: SelectDateUtil,
        private readonly selectThemeUtil: SelectThemeUtil,
        private readonly selectTimeUtil: SelectTimeUtil,
    ) { }

    // async onModuleInit() {
    //     console.log('EscapeService initialized, starting initial Escape...');
    //     await this.handleScheduledEscapes();
    // }


    private async findAvailableDate(page: puppeteer.Page, targetTimestamp: number) {
        const dates = await page.$$('.day');

        for (const date of dates) {
            const dateValue = await date.evaluate(el => el.getAttribute('data-date'));
            const isDisabled = await date.evaluate(el => el.classList.contains('disabled'));

            if (Number(dateValue) === targetTimestamp && !isDisabled) {
                return date;
            }
        }

        return null;
    }

    private convertDateToTimestamp(dateStr: string): number {
        // 날짜가 '2024-08-27' 또는 '20240827' 형식으로 주어질 수 있으므로 이를 파싱하여 Date 객체로 변환
        let year: number, month: number, day: number;

        if (dateStr.includes('-')) {
            [year, month, day] = dateStr.split('-').map(Number);
        } else {
            year = Number(dateStr.slice(0, 4));
            month = Number(dateStr.slice(4, 6));
            day = Number(dateStr.slice(6, 8));
        }

        // Date 객체를 생성하고 해당 객체를 타임스탬프로 변환
        const date = new Date(Date.UTC(year, month - 1, day));
        return date.getTime();
    }

    async bookTicket(reservation: CreateEscapeDto): Promise<void> {
        const { url, shopName, date, themeName, time, name, phone, people } = reservation;

        // 예약 시작 시간 기록
        const startTime = Date.now();
        const maxRetries = 1;
        let attempt = 0;

        while (attempt < maxRetries) {
            attempt++

            const browser = await puppeteer.launch({
                headless: false,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--window-size=1920,1080',
                    '--no-zygote', // 초기화 프로세스를 생략하여 속도 향상
                ],
            });
            const page = await browser.newPage();
            page.setViewport({ width: 1920, height: 1080 });

            await page.setRequestInterception(true);

            page.on('request', (req) => {
                const resourceType = req.resourceType();
                if (['image'].includes(resourceType)) {
                    req.abort();
                } else {
                    req.continue();
                }
            });

            // page.on('dialog', async (dialog) => {
            //     console.log(`Dialog message: ${dialog.message()}`);
            //     await dialog.dismiss();
            // });

            page.on('error', (err) => {
                console.error('Page error:', err);
            });

            page.on('pageerror', (pageErr) => {
                console.error('Page script error:', pageErr);
            });

            try {
                // URL에 타임스탬프 추가하여 캐시를 방지하고 항상 새로운 요청처럼 보이도록 위장
                const urlWithTimestamp = `${url}?t=${Date.now()}`;
                await page.goto(urlWithTimestamp, { waitUntil: 'networkidle2' });

                // "예약" 텍스트를 포함하는 요소를 찾아 클릭
                // await page.$$eval('a', (elements) => {
                //     elements.forEach((element) => {
                //         if (element.textContent.includes('예약')) {
                //             element.click();
                //             return true;
                //         }
                //     });
                // });
                // 예약페이지로 이동
                await page.waitForSelector('#navbarCollapse > ul > li:nth-child(3)');
                await page.click('#navbarCollapse > ul > li:nth-child(3)');

                // 매장선택
                await this.selectShopUtil.selectShop(page, shopName)

                // 날짜 선택
                await this.selectDateUtil.selectDate(page, date)

                // 테마선택
                await this.selectThemeUtil.selectTheme(page, themeName)

                // 시간대 선택
                let timeResult = '';
                if (time.includes('~')) {
                    timeResult = await this.selectTimeUtil.selectTime(page, time, true);
                } else {
                    timeResult = await this.selectTimeUtil.selectTime(page, time);
                }

                // 이름 입력
                // await page.waitForSelector('#name');
                await page.type('#name', name);

                // 인원 선택
                // await page.waitForSelector('select[name="people"]');
                const peopleOptions = await page.$$('#custom-form-0 option');

                for (const option of peopleOptions) {
                    const value = await option.evaluate((el) =>
                        el.getAttribute('value'),
                    );
                    if (value === people) {
                        await option.evaluate((el) => (el.selected = true));
                        break;
                    }
                }

                // 연락처 입력
                await page.type('#phone-number', phone);

                // 예약 버튼 클릭
                await page.waitForSelector("#submit-booking");
                await page.click("#submit-booking");

                // 예약 완료 메시지 로그
                console.log(`예약 완료: ${name} ${timeResult} ${themeName}`);
                break; // 성공했을 경우 루프를 종료
            } catch (error) {
                console.error(`Error during Escape for ${time}:`, error);
                if (attempt >= maxRetries) {
                    console.error('Max retries reached. Escape failed.');
                    throw error;
                }
                console.log('retry...');
                await this.delay(500); // 0.5초 대기
            } finally {
                try {
                    // if (page) await page.close(); // 페이지 닫기
                    // if (browser) await browser.close(); // 브라우저 닫기
                } catch (closeError) {
                    console.error('Error closing page or browser:', closeError);
                }

                // 예약 완료 시간 기록 및 경과 시간 계산
                const endTime = Date.now();
                const duration = (endTime - startTime) / 1000; // 초 단위로 경과 시간 계산
                console.log(`Reservation for ${name} took ${duration} seconds.`);
            }

        }
    }

    private async delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async bookMultiple(reservations: CreateEscapeDto[]): Promise<void> {
        if (!reservations || !Array.isArray(reservations)) {
            throw new Error("Missing or invalid 'reservations' array.");
        }

        await Promise.all(
            reservations.map((reservation) => this.bookTicket(reservation)),
        );
    }
}
