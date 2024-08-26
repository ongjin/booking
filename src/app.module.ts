import { Module } from '@nestjs/common';
import { BookingModule } from './booking/booking.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BookingService } from './booking/booking.service';

@Module({
    imports: [
        BookingModule,
        ScheduleModule.forRoot()
    ],
    // providers: [BookingService],
})
export class AppModule { }
