import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class SelectTimeUtil {
    // 시간 문자열을 분 단위로 변환 (예: "14:35" -> 875분)
    parseTimeString(timeString: string): number {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + (minutes ? minutes : 0);
    }

    // 시간 선택 메서드
    async selectTime(page: puppeteer.Page, time: string, isRange = false): Promise<string> {
        await page.waitForSelector('#slot-table > tr');
        const timeSlots = await page.$$('#slot-table > tr');

        if (isRange) {
            const [start, end] = time.split('~').map((t) => t.trim());
            const minTime = this.parseTimeString(this.normalizeTime(start));
            const maxTime = this.parseTimeString(this.normalizeTime(end));

            for (const slot of timeSlots) {
                const isReserved = await slot.evaluate((el) => el.classList.contains('disabled'));
                if (isReserved) continue;

                const slotTime = await slot.evaluate(el => el.querySelector('td').textContent.trim());
                const slotTimeInMinutes = this.parseTimeString(slotTime);

                if (slotTimeInMinutes >= minTime && slotTimeInMinutes <= maxTime) {
                    await slot.click();
                    return slotTime;
                }
            }
            throw new Error(`No available time found between ${start} and ${end}.`);
        } else {
            const normalizedTime = this.normalizeTime(time);

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

    // 시간 문자열을 "14시" 또는 "14:00" 형식으로 표준화
    normalizeTime(time: string): string {
        time = time.trim().replace('시', '').replace('분', '');
        if (time.includes(':')) {
            return time;
        } else {
            return `${time}:00`;
        }
    }
}
