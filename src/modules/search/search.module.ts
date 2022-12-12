import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerAtp, PlayerWta } from 'src/modules/player/entity/player.entity';
import { GameAtp, GameWta } from 'src/modules/game/entity/game.entity';
import { SharedModule } from 'src/modules/shared/shared.module';
import {
  TournamentAtp,
  TournamentWta,
} from 'src/modules/tournament/entity/tournament.entity';
import { PointPrize } from 'src/modules/points/entity/prize.entity';
import { TodayAtp, TodayWta } from 'src/modules/today/entity/today.entity';
import { H2hAtp, H2hWta } from 'src/modules/h2h/entity/h2h.entity';
import { SearchService } from 'src/services/search.service';
import { SearchController } from 'src/controllers/search.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TournamentAtp,
      TournamentWta,
      PointPrize,
      GameAtp,
      GameWta,
      PlayerAtp,
      PlayerWta,
      TodayAtp,
      TodayWta,
      H2hAtp,
      H2hWta,
    ]),
    SharedModule,
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
