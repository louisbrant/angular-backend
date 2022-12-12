import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LiveEventsService } from 'src/services/live-events.service';

@Controller('tennis/api2/live-events')
@ApiTags('live-events')
export class LiveEventsController {
  constructor(private readonly liveEventService: LiveEventsService) {}

  @Get(':type')
  findLiveEvents(
    @Param('type') type: string
  ) {
    return this.liveEventService.liveEvents(type);
  }
}
