import { Module } from '@nestjs/common';
import { FormatDateUtil } from './format-date.util';
import { SelectDateUtil } from './select-date.util';
import { SelectThemeUtil } from './select-theme.util';
import { SelectTimeUtil } from './select-time.util';

@Module({
    providers: [FormatDateUtil, SelectDateUtil, SelectThemeUtil, SelectTimeUtil],
    exports: [FormatDateUtil, SelectDateUtil, SelectThemeUtil, SelectTimeUtil],
})
export class ZeroWorldUtilsModule { }
