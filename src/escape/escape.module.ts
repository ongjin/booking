import { Module } from '@nestjs/common';
import { EscapeService } from './escape.service';
import { EscapeController } from './escape.controller';
import { EscapeUtilsModule } from './utils/utils.module';

@Module({
    imports: [EscapeUtilsModule],
    providers: [EscapeService],
    controllers: [EscapeController],
})
export class EscapeModule { }
