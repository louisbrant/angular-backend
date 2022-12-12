import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PointPrizeService } from 'src/services/point-prize.service';
import { UpdatePointDto } from 'src/modules/points/dto/update-point.dto';
import { CreatePointDto } from 'src/modules/points/dto/create-point.dto';
import { ApiTags } from '@nestjs/swagger';

@Controller('tennis/api2/points')
@ApiTags('points')
export class PointPrizeController {
  constructor(private readonly pointsService: PointPrizeService) {}

  @Post()
  create(@Body() createPointDto: CreatePointDto) {
    return this.pointsService.create(createPointDto);
  }

  @Get()
  findAll() {
    return this.pointsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pointsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePointDto: UpdatePointDto) {
    return this.pointsService.update(+id, updatePointDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pointsService.remove(+id);
  }
}
