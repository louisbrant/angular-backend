import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerAtp, PlayerWta } from 'src/modules/player/entity/player.entity';
import { GameAtp, GameWta } from 'src/modules/game/entity/game.entity';
import { SharedModule } from 'src/modules/shared/shared.module';
import { TournamentService } from 'src/services/tournament.service';
import {
  TournamentAtp,
  TournamentWta,
} from 'src/modules/tournament/entity/tournament.entity';
import { TournamentController } from 'src/controllers/tournament.controller';
import { PointPrize } from 'src/modules/points/entity/prize.entity';
import { TodayAtp, TodayWta } from 'src/modules/today/entity/today.entity';
import { H2hAtp, H2hWta } from 'src/modules/h2h/entity/h2h.entity';

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
  controllers: [TournamentController],
  providers: [TournamentService],
})
export class TournamentModule {}
