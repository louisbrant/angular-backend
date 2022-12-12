import { Module } from '@nestjs/common';
import { PlayerStatsController } from 'src/controllers/player-stats.controller';
import { PlayerStatsService } from 'src/services/player-stats.service';

@Module({
  controllers: [PlayerStatsController],
  providers: [PlayerStatsService],
})
export class PlayerStatsModule {}
