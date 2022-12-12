import { Injectable } from '@nestjs/common';
import { UpdatePlayerStatDto } from 'src/modules/player-stats/dto/update-player-stat.dto';
import { CreatePlayerStatDto } from 'src/modules/player-stats/dto/create-player-stat.dto';

@Injectable()
export class PlayerStatsService {
  create(createPlayerStatDto: CreatePlayerStatDto) {
    return 'This action adds a new playerStat';
  }

  findAll() {
    return `This action returns all playerStats`;
  }

  findOne(id: number) {
    return `This action returns a #${id} playerStat`;
  }

  update(id: number, updatePlayerStatDto: UpdatePlayerStatDto) {
    return `This action updates a #${id} playerStat`;
  }

  remove(id: number) {
    return `This action removes a #${id} playerStat`;
  }
}
