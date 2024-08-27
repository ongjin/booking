import { Injectable } from '@nestjs/common';

@Injectable()
export class SelectTimeUtil {
    parseTimeString(timeString: string): number {
        const [hours, minutes] = timeString
            .replace('시', '')
            .replace('분', '')
            .trim()
            .split(' ');
        return parseInt(hours) * 60 + (minutes ? parseInt(minutes) : 0);
    }

    async selectTime(page, time, isRange = false): Promise<string> {
        await page.waitForSelector('#themeTimeWrap > label');
        const timeLabels = await page.$$('#themeTimeWrap > label');

        if (isRange) {
            const [start, end] = time.split('~').map((t) => t.trim());
            const minTime = this.parseTimeString(start);
            const maxTime = this.parseTimeString(end);

            for (const label of timeLabels) {
                const isReserved = await label.evaluate((el) =>
                    el.classList.contains('active'),
                );
                if (isReserved) continue;

                const labelText = await label.evaluate((el) => el.textContent.trim());
                const labelTime = this.parseTimeString(labelText);

                if (labelTime >= minTime && labelTime <= maxTime) {
                    await label.click();
                    return labelText;
                }
            }
            throw new Error(`No available time found between ${start} and ${end}.`);
        } else {
            const timeString = time.includes('시') ? time : `${time}시`;

            for (const label of timeLabels) {
                const isReserved = await label.evaluate((el) =>
                    el.classList.contains('active'),
                );
                if (isReserved) continue;

                const labelText = await label.evaluate((el) => el.textContent.trim());
                if (labelText.includes(timeString)) {
                    await label.click();
                    return labelText;
                }
            }
            throw new Error(`Time "${time}"시 예약 꽉참`);
        }
    }
}
