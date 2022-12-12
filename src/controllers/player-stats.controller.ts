import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PlayerStatsService } from 'src/services/player-stats.service';
import { UpdatePlayerStatDto } from 'src/modules/player-stats/dto/update-player-stat.dto';
import { CreatePlayerStatDto } from 'src/modules/player-stats/dto/create-player-stat.dto';
import { ApiTags } from '@nestjs/swagger';

@Controller('tennis/api2/player-stats')
@ApiTags('player-stats')
export class PlayerStatsController {
  constructor(private readonly playerStatsService: PlayerStatsService) {}

  @Post()
  create(@Body() createPlayerStatDto: CreatePlayerStatDto) {
    return this.playerStatsService.create(createPlayerStatDto);
  }

  @Get()
  findAll() {
    return this.playerStatsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.playerStatsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePlayerStatDto: UpdatePlayerStatDto,
  ) {
    return this.playerStatsService.update(+id, updatePlayerStatDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.playerStatsService.remove(+id);
  }
}
