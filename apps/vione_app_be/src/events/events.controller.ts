import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { EventsService, CreateEventDto, UpdateEventDto } from './events.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('my-events')
  async listMyEvents(@Request() req: any) {
    return this.eventsService.listMyEvents(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('overview')
  async getEventsOverview(
    @Request() req: any,
    @Query('associationId') associationId?: string,
  ) {
    return this.eventsService.getEventsOverview(req.user.id, associationId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('registrations')
  async listRegistrations(
    @Request() req: any,
    @Query('associationId') associationId?: string,
    @Query('eventId') eventId?: string,
  ) {
    return this.eventsService.listRegistrations(req.user?.id || '', associationId, eventId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('with-registrations')
  async listEventsWithRegistrations(
    @Request() req: any,
    @Query('associationId') associationId?: string,
  ) {
    return this.eventsService.listEventsWithRegistrations(req.user.id, associationId);
  }

  @Get()
  async listEvents(
    @Request() req: any,
    @Query('associationId') associationId?: string,
  ) {
    return this.eventsService.listEvents(req.user?.id || '', associationId);
  }

  @Get(':id')
  async getEventById(@Request() req: any, @Param('id') id: string) {
    return this.eventsService.getEventById(req.user?.id || '', id);
  }

  @Get(':id/tickets')
  async getEventTickets(@Param('id') id: string) {
    return this.eventsService.getEventTickets(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createEvent(@Request() req: any, @Body() body: CreateEventDto) {
    return this.eventsService.createEvent(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/register')
  async registerForEvent(@Request() req: any, @Param('id') id: string, @Body() body?: any) {
    return this.eventsService.registerForEvent(req.user.id, id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  async cancelEventRegistration(@Request() req: any, @Param('id') id: string) {
    return this.eventsService.cancelEventRegistration(req.user.id, id);
  }

  @Put(':id')
  async updateEvent(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: UpdateEventDto,
  ) {
    return this.eventsService.updateEvent(req.user.id, id, body);
  }

  @Put(':id/qr-fields')
  async updateQrFields(
    @Request() req: any,
    @Param('id') id: string,
    @Body('qrFields') qrFields: string[],
  ) {
    return this.eventsService.updateQrFields(req.user.id, id, qrFields);
  }

  @UseGuards(JwtAuthGuard)
  @Put('registrations/:id/seating')
  async updateRegistrationSeating(
    @Request() req: any,
    @Param('id') id: string,
    @Body('seatAssignment') seatAssignment: string,
  ) {
    return this.eventsService.updateRegistrationSeating(req.user.id, id, seatAssignment);
  }

  @UseGuards(JwtAuthGuard)
  @Post('registrations/:id/walk-in-cash')
  async recordWalkInCashPayment(
    @Request() req: any,
    @Param('id') id: string,
    @Body('amount') amount?: number,
  ) {
    return this.eventsService.recordWalkInCashPayment(req.user.id, id, amount);
  }

  @UseGuards(JwtAuthGuard)
  @Post('registrations/:id/send-payment-reminder')
  async sendPaymentReminder(
    @Request() req: any,
    @Param('id') id: string,
  ) {
    return this.eventsService.sendPaymentReminder(req.user.id, id);
  }

  @Delete(':id')
  async deleteEvent(@Request() req: any, @Param('id') id: string) {
    return this.eventsService.deleteEvent(req.user.id, id);
  }
}
