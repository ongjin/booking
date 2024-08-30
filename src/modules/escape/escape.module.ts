import { Module } from '@nestjs/common';
import { EscapeService } from './escape.service';
import { EscapeController } from './escape.controller';
import { PuppeteerModule } from '@/modules/puppeteer/puppeteer.module';
import { DateUtil } from '@/utils/date.util';


@Module({
    imports: [PuppeteerModule],
    providers: [EscapeService, DateUtil],
    controllers: [EscapeController],
})
export class EscapeModule { }
