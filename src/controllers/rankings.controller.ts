import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TourType } from 'src/modules/shared/middlewares/tour.middleware';
import { RankingsService } from 'src/services/rankings.service';
import { RankingDto } from 'src/modules/rankings/dto/ranking.dto';

@Controller('tennis/api2/ranking')
@ApiTags('ranking')
export class RankingsController {
  constructor(private readonly rankingService: RankingsService) {}

  @Get(':type/top')
  findTop10Ranking(@Param('type') type: TourType) {
    return this.rankingService.rankingTop10(type);
  }

  @Get(':type')
  findRanking(
    @Param('type') type: TourType,
    @Query() queryParams: RankingDto,
  ) {
    return this.rankingService.ranking(type, queryParams);
  }

  @Get(':type/filters')
  findRankingFilters(@Param('type') type: TourType) {
    return this.rankingService.rankingFilters(type);
  }
}
