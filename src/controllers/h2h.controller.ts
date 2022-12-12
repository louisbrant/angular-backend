import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { MatchPlayedGameDto } from 'src/modules/game/dto/match-played-game.dto';
import { CreateH2hDto } from 'src/modules/h2h/dto/create-h2h.dto';
import { UpdateH2hDto } from 'src/modules/h2h/dto/update-h2h.dto';
import { TourType } from 'src/modules/shared/middlewares/tour.middleware';
import { H2hService } from 'src/services/h2h.service';

@Controller('tennis/api2/h2h')
@ApiTags('h2h')
export class H2hController {
  constructor(private readonly h2hService: H2hService) {}

  @Get('profile/:type/:player1/:player2/:limit')
  async findProfiles(
    @Param('type') type: TourType,
    @Param('player1') player1: string,
    @Param('player2') player2: string,
    @Param('limit') limit: boolean,
  ) {
    return await this.h2hService.findProfile(type, player1, player2, limit);
  }

  @Get('stats/:type/:player1/:player2')
  async findH2hStats(
    @Param('type') type: TourType,
    @Param('player1') player1: string,
    @Param('player2') player2: string,
    @Query() queryParams: MatchPlayedGameDto,
  ) {
    return await this.h2hService.pvpH2hStats(
      type,
      player1,
      player2,
      queryParams,
    );
  }

  @Get('history/:type/:player1/:player2')
  async findMatchesHistory(
    @Param('type') type: TourType,
    @Param('player1') player1: string,
    @Param('player2') player2: string,
    @Query() queryParams: MatchPlayedGameDto,
  ) {
    return await this.h2hService.pvpMatchesPlayed(
      type,
      player1,
      player2,
      queryParams,
    );
  }

  @Get('current/:type/:player/:player2')
  async findCurrentEventStats(
    @Param('type') type: TourType,
    @Param('player') player: string,
    @Param('player2') player2: string,
  ) {
    return await this.h2hService.findCurrentEventStats(type, player, player2);
  }

  @Get('breakdown/:type/:player')
  async findBreakDownStats(
    @Param('type') type: TourType,
    @Param('player') player: string,
    @Query() queryParams: MatchPlayedGameDto,
  ) {
    return await this.h2hService.findBreakdownStats(type, player, queryParams);
  }

  @Get('recent/:type/:player')
  async findRecentMatches(
    @Param('type') type: TourType,
    @Param('player') player: string,
    @Query() queryParams: MatchPlayedGameDto,
  ) {
    return await this.h2hService.findPlayerRecentMatches(
      type,
      player,
      queryParams,
    );
  }

  @Get('upcoming/:type/:player1/:player2')
  async findUpcomingMatches(
    @Param('type') type: TourType,
    @Param('player1') playerOne: string,
    @Param('player2') playerTwo: string,
  ) {
    return await this.h2hService.findUpcomingMatch(type, playerOne, playerTwo);
  }

  @Get('filters/:player1/:player2/:type/vs')
  async findFiltersVs(
    @Param('player1') playerOne: string,
    @Param('player2') playerTwo: string,
    @Param('type') type: TourType,
  ) {

    return await this.h2hService.findFiltersVs(
      type,
      playerOne,
      playerTwo,
    );
  }

  @Get('filters/:player1/:player2')
  async findFilters(
    @Param('player1') playerOne: string,
    @Param('player2') playerTwo: string,
  ) {
    return await this.h2hService.findFilters(
      TourType.ATP,
      playerOne,
      playerTwo,
    );
  }
}
