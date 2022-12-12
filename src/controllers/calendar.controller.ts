import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CalendarService } from 'src/services/calendar.service';
import { CalendarFilterDto } from 'src/modules/calendar/dto/calendar-filter.dto';

@Controller('tennis/api2/calendar/:type')
@ApiTags('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('filters')
  async findFilters(@Param('type') type: string) {
    return await this.calendarService.findFilters(type);
  }

  @Get(':year')
  findAll(
    @Param('type') type: string,
    @Param('year', new ParseIntPipe()) year: number,
    @Query() queryParams: CalendarFilterDto,
  ) {
    return this.calendarService.findAll(type, year, queryParams);
  }
}
