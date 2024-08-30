import { Module } from '@nestjs/common';
import { DateUtil } from './date.util';

@Module({
    providers: [DateUtil],
    exports: [DateUtil],
})
export class UtilsModule { }
