import { Module } from '@nestjs/common';
import { SelectShopUtil } from './select-shop.utils';
import { SelectDateUtil } from './select-date.utils';
import { SelectThemeUtil } from './select-theme.utils';
import { SelectTimeUtil } from './select-time.utils';
import { FormatDateUtil } from '@/zeroWorld/utils/format-date.util';

@Module({
    providers: [SelectShopUtil, SelectDateUtil, SelectThemeUtil, SelectTimeUtil, FormatDateUtil],
    exports: [SelectShopUtil, SelectDateUtil, SelectThemeUtil, SelectTimeUtil, FormatDateUtil],
})
export class EscapeUtilsModule { }
