import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { H2hController } from 'src/controllers/h2h.controller';
import { StatController } from 'src/controllers/stat.controller';
import { GameService } from 'src/services/game.service';
import { H2hService } from 'src/services/h2h.service';
import { SharedService } from 'src/services/shared.service';
import { Court } from '../court/entity/court.entity';
import { GameWta, GameAtp } from '../game/entity/game.entity';
import { PlayerStatAtp, PlayerStatWta } from '../player-stats/entity/player-stat.entity';
import { PlayerAtp, PlayerWta } from '../player/entity/player.entity';
import { RatingAtp, RatingWta } from '../ratings/entity/rating.entity';
import { tour } from '../shared/middlewares/tour.middleware';
import { StatAtp, StatWta } from '../stat/entity/stat.entity';
import { TodayAtp, TodayWta } from '../today/entity/today.entity';
import { H2hAtp, H2hWta } from './entity/h2h.entity';
import { Rank } from 'src/modules/rank/entity/rank.entity';
import { Round } from 'src/modules/round/entity/round.entity';
import { TournamentAtp, TournamentWta } from 'src/modules/tournament/entity/tournament.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([
      GameWta,
      GameAtp,
      StatAtp,
      StatWta,
      PlayerAtp,
      PlayerWta,
      TodayAtp,
      TodayWta,
      H2hAtp,
      H2hWta,
      PlayerStatAtp,
      PlayerStatWta,
      TournamentAtp,
      TournamentWta,
      Court,
      Rank,
      Round,
      RatingAtp,
      RatingWta
    ])
  ],
  controllers: [H2hController],
  providers: [H2hService, SharedService, GameService],
})

export class H2hModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
      consumer.apply(tour)
      .forRoutes(StatController)
  }
}
