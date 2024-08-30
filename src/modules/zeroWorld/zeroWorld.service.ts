import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { CreateBookingDto } from './dto/create-zeroWorld.dto';
import { DateUtil } from '@/utils/date.util';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PuppeteerService } from '@/modules/puppeteer/puppeteer.service';

@Injectable()
export class ZeroWorldService {
    private readonly maxDelay = Number.MAX_SAFE_INTEGER; // Extremely long delay
    constructor(
        private readonly puppeteerService: PuppeteerService,
        private readonly formatDateUtil: DateUtil,
    ) { }

    // async onModuleInit() {
    //     console.log('BookingService initialized, starting initial booking...');
    //     await this.handleScheduledBookings();
    // }

    // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) // Runs every day at midnight
    async handleScheduledBookings() {
        const reservations: CreateBookingDto[] = [
            {
                url: "http://www.zerogangnam.com",
                themeName: "나비",
                date: "2024-09-04",
                time: "16~22",
                name: "조용진",
                phone: "01057663821",
                people: "3"
            },
            {
                url: "http://www.zerogangnam.com",
                themeName: "겨울",
                date: "2024-09-04",
                time: "10~18",
                name: "이소영",
                phone: "01057663821",
                people: "3"
            }
        ];

        await this.bookMultiple(reservations);
    }

    /** 시간선택 */
    async selectTime(page: puppeteer.Page, time: string, isRange = false): Promise<string> {
        await page.waitForSelector('#themeTimeWrap > label');
        const timeLabels = await page.$$('#themeTimeWrap > label');

        if (isRange) {
            const [start, end] = time.trim().split('~').map((t) => t.trim());
            const minTime = this.formatDateUtil.zeroWorldParseTimeString(start);
            const maxTime = this.formatDateUtil.zeroWorldParseTimeString(end);


            for (const label of timeLabels) {
                const isReserved = await label.evaluate((el) => el.classList.contains('active'));
                if (isReserved) continue;

                const labelText = await label.evaluate((el) => el.textContent.trim());
                const labelTime = this.formatDateUtil.zeroWorldParseTimeString(labelText);

                if (labelTime >= minTime && labelTime <= maxTime) {
                    await label.click();
                    return labelText;
                }
            }
            throw new Error(`No available time found between ${start} and ${end}.`);
        } else {
            for (const label of timeLabels) {
                const isReserved = await label.evaluate((el) => el.classList.contains('active'));
                if (isReserved) continue;

                const labelText = await label.evaluate((el) => el.textContent.trim());
                if (labelText.includes(time)) {
                    await label.click();
                    return labelText;
                }
            }
            throw new Error(`Time "${time}"시 예약 꽉참`);
        }
    }

    /** 테마선택 */
    async selectTheme(page: puppeteer.Page, themeName): Promise<string> {
        await page.waitForSelector('#themeChoice > label');
        const themeLabels = await page.$$('#themeChoice > label');

        for (const label of themeLabels) {
            const labelText = await label.evaluate((el) => el.textContent.trim());
            if (labelText.includes(themeName)) {
                await label.click();
                return labelText;
            }
        }
        throw new Error(`Theme "${themeName}" not found.`);
    }

    /** 날짜선택 */
    async selectDate(page: puppeteer.Page, year, month, day): Promise<string> {
        let dateFound = false;
        const adjustedDay = day.startsWith('0') ? day.substring(1) : day;

        let attempts = 0;
        const maxAttempts = 12;

        while (!dateFound && attempts < maxAttempts) {
            attempts++;

            const dates = await page.$$('#calendar [data-year][data-month][data-date]');

            for (const element of dates) {
                const elementYear = await element.evaluate((el) => el.getAttribute('data-year'));
                const elementMonth = await element.evaluate((el) => el.getAttribute('data-month'));
                const elementDate = await element.evaluate((el) => el.getAttribute('data-date'));
                const isDisabled = await element.evaluate((el) => el.classList.contains('-disabled-'));

                if (
                    parseInt(elementYear) === parseInt(year) &&
                    parseInt(elementMonth) === parseInt(month) - 1 &&
                    parseInt(elementDate) === parseInt(adjustedDay) &&
                    !isDisabled
                ) {
                    await element.click();
                    dateFound = true;
                    return `${year}-${month}-${day}`
                }
            }

            if (!dateFound) {
                await page.waitForSelector('[data-action="next"]');
                const nextButton = await page.$('[data-action="next"]');
                if (nextButton) {
                    await nextButton.click();
                } else {
                    throw new Error(`다음 달로 이동할 수 없습니다.`);
                }
            }
        }

        if (!dateFound) {
            throw new Error(
                `Date "${year}-${month}-${day}" not found or is disabled after ${maxAttempts} attempts.`,
            );
        }
    }

    async bookTicket(reservation: CreateBookingDto): Promise<void> {
        const { url, date, themeName, time, name, phone, people } = reservation;

        // 예약 시작 시간 기록
        const startTime = Date.now();
        const maxRetries = 10;
        let attempt = 0;

        while (attempt < maxRetries) {
            attempt++
            const browser = await this.puppeteerService.launchBrowser();
            const page = await this.puppeteerService.setupPage(browser);
            try {


                page.on('dialog', async (dialog) => {
                    console.log(`Dialog message: ${dialog.message()}`);
                    await dialog.dismiss();
                });

                // await page.goto(url);
                // await page.goto(url, { waitUntil: 'networkidle0' });
                // URL에 타임스탬프 추가하여 캐시를 방지하고 항상 새로운 요청처럼 보이도록 위장
                const urlWithTimestamp = `${url}?t=${Date.now()}`;
                await page.goto(urlWithTimestamp, { waitUntil: 'networkidle2' });

                // 팝업 창 닫기
                // await page.waitForSelector('#wrap > div > div > div > button.evePopupCloseBtn');
                // await page.click('#wrap > div > div > div > button.evePopupCloseBtn');
                const popupCloseBtnSelector = '#wrap > div > div > div > button.evePopupCloseBtn';
                if (await page.$(popupCloseBtnSelector)) {
                    await page.click(popupCloseBtnSelector);
                }

                // "예약" 텍스트를 포함하는 요소를 찾아 클릭
                // await page.$$eval('a', (elements) => {
                //     elements.forEach((element) => {
                //         if (element.textContent.includes('예약')) {
                //             element.click();
                //             return true;
                //         }
                //     });
                // });
                await page.waitForSelector('#nav > div > ul > li:nth-child(3)');
                await page.click('#nav > div > ul > li:nth-child(3)');


                // 날짜 선택
                const [year, month, day] = this.formatDateUtil.formatDate(date, 'YYYY-MM-DD').split('-');
                await this.selectDate(page, year, month, day);

                // 테마 선택
                await this.selectTheme(page, themeName);

                // 시간 선택
                let timeResult = '';
                if (time.includes('~')) {
                    timeResult = await this.selectTime(page, time, true);
                } else {
                    timeResult = await this.selectTime(page, time);
                }

                // 'NEXT' 버튼 클릭
                await page.waitForSelector('#nextBtn');
                await page.click('#nextBtn');

                // 이름 입력
                await page.waitForSelector('input[name="name"]');
                await page.type('input[name="name"]', name);

                // 핸드폰 번호 입력
                // await page.waitForSelector('input[name="phone"]');
                await page.type('input[name="phone"]', phone);

                // 인원 선택
                // await page.waitForSelector('select[name="people"]');
                const peopleOptions = await page.$$('select[name="people"] option');

                for (const option of peopleOptions) {
                    const value = await option.evaluate((el) =>
                        el.getAttribute('value'),
                    );
                    if (value === people) {
                        await option.evaluate((el) => (el.selected = true));
                        break;
                    }
                }

                // 약관 동의 체크박스 선택
                await page.waitForSelector('div.step2-policy.ta-c > label');
                await page.click('div.step2-policy.ta-c > label');

                // 예약 버튼 클릭
                // await page.waitForSelector("#reservationBtn");
                // await page.click("#reservationBtn");

                // 예약 완료 메시지 로그
                console.log(`제로월드 예약 완료: ${name} ${timeResult} ${themeName}`);
                break; // 성공했을 경우 루프를 종료
            } catch (error) {
                console.error(`Error during booking for ${time}:`, error);
                if (attempt >= maxRetries) {
                    console.error('Max retries reached. Booking failed.');
                    throw error;
                }
                console.log('retry...');
                await this.delay(500); // 0.5초 대기
            } finally {
                try {
                    if (page) await page.close(); // 페이지 닫기
                    if (browser) await browser.close(); // 브라우저 닫기
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

    async bookMultiple(reservations: CreateBookingDto[]): Promise<void> {
        if (!reservations || !Array.isArray(reservations)) {
            throw new Error("Missing or invalid 'reservations' array.");
        }

        await Promise.all(
            reservations.map((reservation) => this.bookTicket(reservation)),
        );
    }
}
