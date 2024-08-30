import { Controller, Post, Body } from '@nestjs/common';
import { ZeroWorldService } from './zeroWorld.service';
import { CreateBookingDto } from './dto/create-zeroWorld.dto';

@Controller('zero-world')
export class ZeroWorldController {
    constructor(private readonly bookingService: ZeroWorldService) { }

    @Post('reservation')
    async create(@Body('reservations') reservations: CreateBookingDto[]) {
        if (!reservations || !Array.isArray(reservations)) {
            throw new Error("Missing or invalid 'reservations' array.");
        }

        await this.bookingService.bookMultiple(reservations);
        return { message: 'All bookings completed successfully!' };
    }
}
