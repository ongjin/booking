import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { CreateBookingDto } from './dto/create-booking.dto';
import { FormatDateUtil } from '../utils/format-date.util';
import { SelectDateUtil } from '../utils/select-date.util';
import { SelectThemeUtil } from '../utils/select-theme.util';
import { SelectTimeUtil } from '../utils/select-time.util';

@Injectable()
export class BookingService {
    constructor(
        private readonly formatDateUtil: FormatDateUtil,
        private readonly selectDateUtil: SelectDateUtil,
        private readonly selectThemeUtil: SelectThemeUtil,
        private readonly selectTimeUtil: SelectTimeUtil,
    ) { }

    async bookTicket(reservation: CreateBookingDto): Promise<void> {
        const { url, date, themeName, time, name, phone, people } = reservation;

        // 예약 시작 시간 기록
        const startTime = Date.now();

        const browser = await puppeteer.launch({
            headless: true,
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

        page.on('dialog', async (dialog) => {
            console.log(`Dialog message: ${dialog.message()}`);
            await dialog.dismiss();
        });

        page.on('error', (err) => {
            console.error('Page error:', err);
        });

        page.on('pageerror', (pageErr) => {
            console.error('Page script error:', pageErr);
        });

        try {
            // await page.goto(url);
            // await page.goto(url, { waitUntil: 'networkidle0' });
            // URL에 타임스탬프 추가하여 캐시를 방지하고 항상 새로운 요청처럼 보이도록 위장
            const urlWithTimestamp = `${reservation.url}?t=${Date.now()}`;
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
            await this.selectDateUtil.selectDate(page, year, month, day);

            // 테마 선택
            await this.selectThemeUtil.selectTheme(page, themeName);

            // 시간 선택
            let timeResult = '';
            if (time.includes('~')) {
                timeResult = await this.selectTimeUtil.selectTime(page, time, true);
            } else {
                timeResult = await this.selectTimeUtil.selectTime(page, time);
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
            console.log(`예약 완료: ${name} ${timeResult} ${themeName}`);
        } catch (error) {
            console.error(`Error during booking for ${time}:`, error);
            throw error;
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

    async bookMultiple(reservations: CreateBookingDto[]): Promise<void> {
        if (!reservations || !Array.isArray(reservations)) {
            throw new Error("Missing or invalid 'reservations' array.");
        }

        await Promise.all(
            reservations.map((reservation) => this.bookTicket(reservation)),
        );
    }
}
