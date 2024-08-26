import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { UtilsModule } from 'src/utils/utils.module';
import { BookingController } from './booking.controller';

@Module({
    imports: [UtilsModule],
    providers: [BookingService],
    controllers: [BookingController],
})
export class BookingModule { }
