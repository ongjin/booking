import { Injectable } from '@nestjs/common';

@Injectable()
export class SelectDateUtil {
    async selectDate(page, year, month, day): Promise<void> {
        let dateFound = false;
        const adjustedDay = day.startsWith('0') ? day.substring(1) : day;

        let attempts = 0;
        const maxAttempts = 12;

        while (!dateFound && attempts < maxAttempts) {
            attempts++;

            const dates = await page.$$('#calendar [data-year][data-month][data-date]');

            for (const element of dates) {
                const elementYear = await element.evaluate((el) =>
                    el.getAttribute('data-year'),
                );
                const elementMonth = await element.evaluate((el) =>
                    el.getAttribute('data-month'),
                );
                const elementDate = await element.evaluate((el) =>
                    el.getAttribute('data-date'),
                );
                const isDisabled = await element.evaluate((el) =>
                    el.classList.contains('-disabled-'),
                );

                if (
                    parseInt(elementYear) === parseInt(year) &&
                    parseInt(elementMonth) === parseInt(month) - 1 &&
                    parseInt(elementDate) === parseInt(adjustedDay) &&
                    !isDisabled
                ) {
                    await element.click();
                    dateFound = true;
                    break;
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
}
