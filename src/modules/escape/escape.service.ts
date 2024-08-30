import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { CreateEscapeDto } from './dto/create-escape.dto';
import { PuppeteerService } from '@/modules/puppeteer/puppeteer.service';
import { DateUtil } from '@/utils/date.util';

@Injectable()
export class EscapeService {
    private readonly maxDelay = Number.MAX_SAFE_INTEGER;
    constructor(
        private readonly puppeteerService: PuppeteerService,
        private readonly formatDateUtil: DateUtil
    ) { }

    // async onModuleInit() {
    //     console.log('EscapeService initialized, starting initial Escape...');
    //     await this.handleScheduledEscapes();
    // }

    // 시간 선택 메서드
    async selectTime(page: puppeteer.Page, time: string, isRange = false): Promise<string> {
        await page.waitForSelector('#slot-table > tr');
        const timeSlots = await page.$$('#slot-table > tr');

        if (isRange) {
            const [start, end] = time.split('~').map((t) => t.trim());
            const minTime = this.formatDateUtil.escapeParseTimeString(this.formatDateUtil.normalizeTime(start));
            const maxTime = this.formatDateUtil.escapeParseTimeString(this.formatDateUtil.normalizeTime(end));

            for (const slot of timeSlots) {
                const isReserved = await slot.evaluate((el) => el.classList.contains('disabled'));
                if (isReserved) continue;

                const slotTime = await slot.evaluate(el => el.querySelector('td').textContent.trim());
                const slotTimeInMinutes = this.formatDateUtil.escapeParseTimeString(slotTime);

                if (slotTimeInMinutes >= minTime && slotTimeInMinutes <= maxTime) {
                    await slot.click();
                    return slotTime;
                }
            }
            throw new Error(`No available time found between ${start} and ${end}.`);
        } else {
            const normalizedTime = this.formatDateUtil.normalizeTime(time);

            for (const slot of timeSlots) {
                const isReserved = await slot.evaluate((el) => el.classList.contains('disabled'));
                if (isReserved) continue;

                const slotTime = await slot.evaluate(el => el.querySelector('td').textContent.trim());

                if (slotTime.includes(time)) {
                    await slot.click();
                    return slotTime;
                }
            }
            throw new Error(`Time "${time}" 예약 불가능.`);
        }
    }

    /** 날짜선택 */
    private async findAvailableDate(page: puppeteer.Page, targetTimestamp: number) {
        await page.waitForSelector('.day'); // 요소가 로드될 때까지 기다림

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
    async selectDate(page: puppeteer.Page, date: string): Promise<string> {
        const targetTimestamp = this.formatDateUtil.convertDateToTimestamp(date);

        while (true) {
            const availableDate = await this.findAvailableDate(page, targetTimestamp);
            if (availableDate) {
                await availableDate.click();
                return date; // 날짜를 성공적으로 선택하면 함수 종료
            } else {
                const nextButton = await page.$('#datepicker .next');
                if (nextButton) {
                    await nextButton.click();
                    // await page.waitForTimeout(1000); // 다음 달로 넘어가고 페이지가 로드될 시간을 확보
                } else {
                    throw new Error(`다음달 없음`);
                }
            }
        }
    }

    /** 지점선택 */
    async selectShop(page: puppeteer.Page, shopName: string): Promise<string> {
        await page.waitForSelector('#shop-table > tr > td > div > span');
        // 모든 지점 span 요소 가져오기
        const shopElements = await page.$$('#shop-table > tr > td > div > span');
        // 각 지점 요소를 순회하면서 이름을 비교
        for (const shopElement of shopElements) {
            const shopText = await shopElement.evaluate((el) => el.textContent.trim());

            // 입력된 지점 이름과 일치하는 경우 클릭
            if (shopText.includes(shopName)) {
                await shopElement.click();
                return shopText
            }
        }
        throw new Error(`${shopName} not found`);
    }

    /** 테마선택 */
    async selectTheme(page: puppeteer.Page, themeName: string): Promise<string> {
        await page.waitForSelector('#theme-table > tr > td > div');
        const themeLabels = await page.$$('#theme-table > tr > td > div');

        for (const label of themeLabels) {
            const themeText = await label.evaluate((el) => el.textContent.trim());

            if (themeText.includes(themeName)) {
                await label.click();
                return themeText
            }
        }
        throw new Error(`${themeName} not found`);
    }

    /** 예매 */
    async bookTicket(reservation: CreateEscapeDto): Promise<void> {
        const { url, shopName, date, themeName, time, name, phone, people } = reservation;

        // 예약 시작 시간 기록
        const startTime = Date.now();
        const maxRetries = 1;
        let attempt = 0;

        while (attempt < maxRetries) {
            attempt++
            const browser = await this.puppeteerService.launchBrowser();
            const page = await this.puppeteerService.setupPage(browser);
            try {
                // alert confirm 조절
                // page.on('dialog', async (dialog) => {
                //     console.log(`Dialog message: ${dialog.message()}`);
                //     await dialog.dismiss();
                // });

                // URL에 타임스탬프 추가하여 캐시를 방지하고 항상 새로운 요청처럼 보이도록 위장
                const urlWithTimestamp = `${url}?t=${Date.now()}`;
                await page.goto(urlWithTimestamp, { waitUntil: 'networkidle2' });

                // 예약페이지로 이동
                await page.waitForSelector('#navbarCollapse > ul > li:nth-child(3)');
                await page.click('#navbarCollapse > ul > li:nth-child(3)');

                // 매장선택
                const shopNameValue = await this.selectShop(page, shopName)

                // 날짜 선택
                const dateValue = await this.selectDate(page, date)

                // 테마선택
                const themeNameValue = await this.selectTheme(page, themeName)

                // 시간대 선택
                let timeResult = '';
                if (time.includes('~')) {
                    timeResult = await this.selectTime(page, time, true);
                } else {
                    timeResult = await this.selectTime(page, time);
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
                console.log(`예약 완료: ${name} ${shopNameValue} ${dateValue} ${timeResult} ${themeNameValue}`);
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

    async bookMultiple(reservations: CreateEscapeDto[]): Promise<void> {
        if (!reservations || !Array.isArray(reservations)) {
            throw new Error("Missing or invalid 'reservations' array.");
        }

        await Promise.all(
            reservations.map((reservation) => this.bookTicket(reservation)),
        );
    }
}
