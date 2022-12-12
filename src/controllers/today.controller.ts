import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UpdateTodayDto } from 'src/modules/today/dto/update-today.dto';
import { TodayService } from 'src/services/today.service';
import { CreateTodayDto } from 'src/modules/today/dto/create-today.dto';
import { ApiTags } from '@nestjs/swagger';

@Controller('tennis/api2/today')
@ApiTags('today')
export class TodayController {
  constructor(private readonly todayService: TodayService) {}

  @Post()
  create(@Body() createTodayDto: CreateTodayDto) {
    return this.todayService.create(createTodayDto);
  }

  @Get()
  findAll() {
    return this.todayService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.todayService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTodayDto: UpdateTodayDto) {
    return this.todayService.update(+id, updateTodayDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.todayService.remove(+id);
  }
}
