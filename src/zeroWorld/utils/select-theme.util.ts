import { Injectable } from '@nestjs/common';

@Injectable()
export class SelectThemeUtil {
    async selectTheme(page, themeName): Promise<void> {
        await page.waitForSelector('#themeChoice > label');
        const themeLabels = await page.$$('#themeChoice > label');

        for (const label of themeLabels) {
            const labelText = await label.evaluate((el) => el.textContent.trim());
            if (labelText.includes(themeName)) {
                await label.click();
                return;
            }
        }
        throw new Error(`Theme "${themeName}" not found.`);
    }
}
