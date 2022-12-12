import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ProfileService } from 'src/services/profile.service';
import { ApiTags } from '@nestjs/swagger';
import { MatchPlayedGameDto } from 'src/modules/game/dto/match-played-game.dto';
import { MatchStatPlayerDto } from 'src/modules/player/dto/match-stat-player.dto';

@Controller('tennis/api2/profile')
@ApiTags('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get(':name')
  async findProfile(@Param('name') name: string) {
    return await this.profileService.information(name.trim());
  }

  @Get(':name/statistics')
  async findStatistics(@Param('name') name: string) {
    return await this.profileService.statistics(name.trim());
  }

  @Get(':name/interesting')
  async findInterestingH2h(@Param('name') name: string) {
    return await this.profileService.interestingH2h(name.trim());
  }

  @Get(':name/upcoming')
  async findUpcomingMatches(@Param('name') name: string) {
    return await this.profileService.upcomingMatches(name.trim());
  }

  @Get(':name/breakdown')
  async findBreakdown(@Param('name') name: string) {
    return await this.profileService.breakdown(name.trim());
  }

  @Get(':name/surface-summary')
  async findSurfaceSummary(@Param('name') name: string) {
    return await this.profileService.surfaceSummary(name.trim());
  }

  @Get(':name/matches-played')
  async findMatchesPlayed(
    @Param('name') name: string,
    @Query() queryParams: MatchPlayedGameDto,
  ) {
    return await this.profileService.matchesPlayed(name.trim(), queryParams);
  }

  @Get(':name/filters')
  async findProfileFilters(@Param('name') name: string) {
    return await this.profileService.profileFilters(name.trim());
  }

  @Get(':name/finals/:year')
  async findFinals(
    @Param('name') name: string,
    @Param('year', new ParseIntPipe()) year: number,
  ) {
    return await this.profileService.finals(name.trim(), year);
  }

  @Get(':name/match-stat/:year')
  async findMatchStats(
    @Param('name') name: string,
    @Param('year') year: number | string,
    @Query() queryParams: MatchStatPlayerDto,
  ) {
    return await this.profileService.matchStats(name.trim(), year, queryParams);
  }

  @Get('search/:name/:type')
  async findSearchProfiles(
    @Param('name') name: string,
    @Param('type') type: string,
  ) {
    return await this.profileService.searchProfiles(name.trim(), type);
  }
}
