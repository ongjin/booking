import { Module } from '@nestjs/common';
import { ZeroWorldService } from './zeroWorld.service';
import { UtilsModule } from '@/utils/utils.module';
import { ZeroWorldController } from './zeroWorld.controller';
import { PuppeteerService } from '@/modules/puppeteer/puppeteer.service';

@Module({
    imports: [UtilsModule],
    providers: [ZeroWorldService, PuppeteerService],
    controllers: [ZeroWorldController],
})
export class ZeroWorldModule { }
