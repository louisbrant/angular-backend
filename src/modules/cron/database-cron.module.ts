import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { H2hAtp, H2hWta } from 'src/modules/h2h/entity/h2h.entity';
import { DatabaseCalculationService } from 'src/modules/cron/database-calculation.service';
import { DatabaseSynchronizerService } from 'src/modules/cron/database-synchronizer.service';
import {
  PlayerStatAtp,
  PlayerStatWta,
} from 'src/modules/player-stats/entity/player-stat.entity';
import { GameAtp, GameWta } from '../game/entity/game.entity';
import { RatingAtp, RatingWta } from '../ratings/entity/rating.entity';
import { StatAtp, StatWta } from '../stat/entity/stat.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([StatAtp, StatWta,GameAtp, GameWta, H2hAtp, H2hWta, PlayerStatAtp, PlayerStatWta, RatingAtp, RatingWta]),
  ],
  providers: [DatabaseCalculationService, DatabaseSynchronizerService],
})
export class DatabaseCronModule {}
