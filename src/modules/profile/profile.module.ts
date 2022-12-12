import { Module } from '@nestjs/common';
import { ProfileController } from 'src/controllers/profile.controller';
import { ProfileService } from 'src/services/profile.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerAtp, PlayerWta } from 'src/modules/player/entity/player.entity';
import { SharedService } from 'src/services/shared.service';
import { GameAtp, GameWta } from 'src/modules/game/entity/game.entity';
import { RatingAtp, RatingWta } from 'src/modules/ratings/entity/rating.entity';
import { PlayerStatAtp, PlayerStatWta } from 'src/modules/player-stats/entity/player-stat.entity';
import { H2hAtp, H2hWta } from 'src/modules/h2h/entity/h2h.entity';
import { TodayAtp, TodayWta } from 'src/modules/today/entity/today.entity';
import { GameService } from 'src/services/game.service';
import { Round } from 'src/modules/round/entity/round.entity';
import { StatAtp, StatWta } from 'src/modules/stat/entity/stat.entity';
import { Rank } from 'src/modules/rank/entity/rank.entity';
import { Court } from 'src/modules/court/entity/court.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlayerAtp,
      PlayerWta,
      GameAtp,
      GameWta,
      RatingAtp,
      RatingWta,
      PlayerStatAtp,
      PlayerStatWta,
      Court,
      Round,
      Rank,
      H2hAtp,
      H2hWta,
      TodayAtp,
      TodayWta,
      StatAtp,
      StatWta
    ])
  ],
  controllers: [ProfileController],
  providers: [ProfileService, SharedService, GameService],
})
export class ProfileModule {}
