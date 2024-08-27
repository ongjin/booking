import { Controller, Post, Body } from '@nestjs/common';
import { EscapeService } from './escape.service';
import { CreateEscapeDto } from './dto/create-escape.dto';

@Controller('escape')
export class EscapeController {
    constructor(private readonly EscapeService: EscapeService) { }

    @Post('reservation')
    async create(@Body('reservations') reservations: CreateEscapeDto[]) {
        if (!reservations || !Array.isArray(reservations)) {
            throw new Error("Missing or invalid 'reservations' array.");
        }

        await this.EscapeService.bookMultiple(reservations);
        return { message: 'All Escapes completed successfully!' };
    }
}
