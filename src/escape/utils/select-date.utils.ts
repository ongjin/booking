import { FormatDateUtil } from '@/zeroWorld/utils/format-date.util';
import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class SelectDateUtil {
    constructor(
        private readonly formatDateUtil: FormatDateUtil,
    ) { }

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

    private convertDateToTimestamp(dateStr: string): number {
        // 날짜가 '2024-08-27' 또는 '20240827' 형식으로 주어질 수 있으므로 이를 파싱하여 Date 객체로 변환
        const [year, month, day] = this.formatDateUtil.formatDate(dateStr, 'YYYY-MM-DD').split('-').map(Number);

        // Date 객체를 생성하고 해당 객체를 타임스탬프로 변환
        const date = new Date(Date.UTC(year, month - 1, day));
        return date.getTime();
    }

    async selectDate(page: puppeteer.Page, date: string): Promise<void> {
        const targetTimestamp = this.convertDateToTimestamp(date);

        while (true) {
            const availableDate = await this.findAvailableDate(page, targetTimestamp);
            if (availableDate) {
                await availableDate.click();
                return; // 날짜를 성공적으로 선택하면 함수 종료
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
}
