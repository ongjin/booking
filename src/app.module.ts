import { Module, ValidationPipe } from '@nestjs/common';
import { BookingModule } from '@/zeroWorld/zeroWorld.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BookingService } from '@/zeroWorld/zeroWorld.service';
import { EscapeModule } from './escape/escape.module';
import { APP_PIPE } from '@nestjs/core';

@Module({
    imports: [
        BookingModule,
        EscapeModule,
        ScheduleModule.forRoot()
    ],
    // providers: [BookingService],
    providers: [
        {
            provide: APP_PIPE,
            useClass: ValidationPipe
        }

    ]
})
export class AppModule { }
