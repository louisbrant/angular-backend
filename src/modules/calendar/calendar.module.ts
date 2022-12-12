import { Module } from '@nestjs/common';
import { CalendarService } from 'src/services/calendar.service';
import { CalendarController } from 'src/controllers/calendar.controller';
import { StatAtp, StatWta } from 'src/modules/stat/entity/stat.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  TournamentAtp,
  TournamentWta,
} from 'src/modules/tournament/entity/tournament.entity';
import { Rank } from 'src/modules/rank/entity/rank.entity';
import { GameService } from 'src/services/game.service';
import { SharedModule } from 'src/modules/shared/shared.module';
import { SharedService } from 'src/services/shared.service';
import { Court } from 'src/modules/court/entity/court.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TournamentAtp,
      TournamentWta,
      Court,
      Rank,
      StatAtp,
      StatWta,
    ]),
  ],
  controllers: [CalendarController],
  providers: [CalendarService, GameService, SharedService],
})
export class CalendarModule {}
