import { Controller, Post, Body } from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('book')
export class BookingController {
    constructor(private readonly bookingService: BookingService) { }

    @Post()
    async create(@Body('reservations') reservations: CreateBookingDto[]) {
        if (!reservations || !Array.isArray(reservations)) {
            throw new Error("Missing or invalid 'reservations' array.");
        }

        await this.bookingService.bookMultiple(reservations);
        return { message: 'All bookings completed successfully!' };
    }
}
