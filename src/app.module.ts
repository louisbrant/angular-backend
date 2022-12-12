import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointPrizeModule } from 'src/modules/points/point-prize.module';
import { RatingsModule } from 'src/modules/ratings/ratings.module';
import { ProfileModule } from 'src/modules/profile/profile.module';
import { CountriesModule } from 'src/modules/country/countries.module';
import { EpModule } from 'src/modules/ep/ep.module';
import { PlayerStatsModule } from 'src/modules/player-stats/player-stats.module';
import { SharedModule } from 'src/modules/shared/shared.module';
import { CalendarModule } from 'src/modules/calendar/calendar.module';
import { TodayModule } from 'src/modules/today/today.module';
import { AppService } from 'src/app.service';
import { AppController } from 'src/app.controller';
import { StatModule } from 'src/modules/stat/stat.module';
import { TournamentModule } from 'src/modules/tournament/tournament.module';
import { GameModule } from 'src/modules/game/game.module';
import { H2hModule } from 'src/modules/h2h/h2h.module';
import { RoundModule } from 'src/modules/round/round.module';
import { Module } from '@nestjs/common';
import { LiveEventsModule } from 'src/modules/live-events/live-events.module';
import { RankingsModule } from 'src/modules/rankings/rankings.module';
import DatabaseConfig from './database/database.config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { InterestingH2hModule } from 'src/modules/interesting-h2h/interesting-h2h.module';
import { DatabaseCronModule } from 'src/modules/cron/database-cron.module';
import { SearchModule } from 'src/modules/search/search.module';

@Module({
  imports: [
    ConfigModule,
    ConfigModule.forRoot({
      envFilePath: ['.env', '.gl.env'],
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: `${process.env.MEDIA_URL}`,
    }),
    TypeOrmModule.forRoot(DatabaseConfig),
    ScheduleModule.forRoot(),
    CalendarModule,
    TournamentModule,
    GameModule,
    StatModule,
    EpModule,
    H2hModule,
    PointPrizeModule,
    RatingsModule,
    CountriesModule,
    TodayModule,
    PlayerStatsModule,
    SharedModule,
    ProfileModule,
    RoundModule,
    LiveEventsModule,
    RankingsModule,
    InterestingH2hModule,
    DatabaseCronModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
