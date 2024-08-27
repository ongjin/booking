import { Injectable } from '@nestjs/common';

@Injectable()
export class SelectShopUtil {
    async selectShop(page, shopName: string): Promise<void> {
        await page.waitForSelector('#shop-table > tr > td > div > span');
        // 모든 지점 span 요소 가져오기
        const shopElements = await page.$$('#shop-table > tr > td > div > span');
        // 각 지점 요소를 순회하면서 이름을 비교
        for (const shopElement of shopElements) {
            const shopText = await shopElement.evaluate((el) => el.textContent.trim());

            // 입력된 지점 이름과 일치하는 경우 클릭
            if (shopText.includes(shopName)) {
                await shopElement.click();
                return
            }
        }
        throw new Error(`${shopName} not found`);
    }
}

