import { Module, ValidationPipe } from '@nestjs/common';
import { ZeroWorldModule } from '@/modules/zeroWorld/zeroWorld.module';
import { ScheduleModule } from '@nestjs/schedule';
import { EscapeModule } from '@/modules/escape/escape.module';
import { APP_PIPE } from '@nestjs/core';

@Module({
    imports: [
        ZeroWorldModule,
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
