import { Module } from '@nestjs/common';
import { BookingService } from './zeroWorld.service';
import { ZeroWorldUtilsModule } from '@/zeroWorld/utils/utils.module';
import { BookingController } from './zeroWorld.controller';

@Module({
    imports: [ZeroWorldUtilsModule],
    providers: [BookingService],
    controllers: [BookingController],
})
export class BookingModule { }
