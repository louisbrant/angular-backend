import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UpdateEpDto } from 'src/modules/ep/dto/update-ep.dto';
import { CreateEpDto } from 'src/modules/ep/dto/create-ep.dto';
import { EpService } from 'src/services/ep.service';
import { ApiTags } from '@nestjs/swagger';

@Controller('tennis/api2/ep')
@ApiTags('ep')
export class EpController {
  constructor(private readonly epService: EpService) {}

  @Post()
  create(@Body() createEpDto: CreateEpDto) {
    return this.epService.create(createEpDto);
  }

  @Get()
  findAll() {
    return this.epService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.epService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEpDto: UpdateEpDto) {
    return this.epService.update(+id, updateEpDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.epService.remove(+id);
  }
}
