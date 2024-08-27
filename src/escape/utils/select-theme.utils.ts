import { Injectable } from '@nestjs/common';

@Injectable()
export class SelectThemeUtil {
    async selectTheme(page, themeName: string): Promise<void> {
        await page.waitForSelector('#theme-table > tr > td > div');
        const themeLabels = await page.$$('#theme-table > tr > td > div');

        for (const label of themeLabels) {
            const labelText = await label.evaluate((el) => el.textContent.trim());
            if (labelText.includes(themeName)) {
                await label.click();
                return
            }
        }
        throw new Error(`${themeName} not found`);
    }
}

