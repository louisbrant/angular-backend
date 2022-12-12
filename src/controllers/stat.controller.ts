import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { UpdateStatDto } from 'src/modules/stat/dto/update-stat.dto';
import { StatService } from 'src/services/stat.service';
import { CreateStatDto } from 'src/modules/stat/dto/create-stat.dto';


@Controller('tennis/api2/stat')
@ApiTags('stat')
export class StatController {
  constructor(private readonly statService: StatService) {}

  @Post()
  create(@Body() createStatDto: CreateStatDto) {
    return this.statService.create(createStatDto);
  }

  @Get()
  findAll() {
    return this.statService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.statService.findOne(+id);
  }

 

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStatDto: UpdateStatDto) {
    return this.statService.update(+id, updateStatDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.statService.remove(+id);
  }
}
