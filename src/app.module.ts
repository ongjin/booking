import { Module } from '@nestjs/common';
import { BookingModule } from '@/zeroWorld/booking.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BookingService } from '@/zeroWorld/booking.service';

@Module({
    imports: [
        BookingModule,
        ScheduleModule.forRoot()
    ],
    // providers: [BookingService],
})
export class AppModule { }
