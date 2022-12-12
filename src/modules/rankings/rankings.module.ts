import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedService } from 'src/services/shared.service';
import { RankingsController } from 'src/controllers/rankings.controller';
import { RankingsService } from 'src/services/rankings.service';
import { RatingAtp, RatingWta } from 'src/modules/ratings/entity/rating.entity';
import { Country } from 'src/modules/country/entity/country.entity';
import { PlayerAtp, PlayerWta } from 'src/modules/player/entity/player.entity';
import { Court } from 'src/modules/court/entity/court.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RatingAtp,
      RatingWta,
      Country,
      Court,
      PlayerAtp,
      PlayerWta,
    ]),
  ],
  controllers: [RankingsController],
  providers: [RankingsService, SharedService],
})
export class RankingsModule {}
