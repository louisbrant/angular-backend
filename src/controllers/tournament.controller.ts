import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TournamentService } from 'src/services/tournament.service';

@Controller('tennis/api2/tournament/:type')
@ApiTags('tournament')
export class TournamentController {
  constructor(private readonly tournamentService: TournamentService) {}

  @Get(':name/most-victories')
  mostVictories(@Param('type') type: string, @Param('name') name: string) {
    return this.tournamentService.mostVictories(type, name);
  }

  @Get(':name/:year/points')
  points(
    @Param('type') type: string,
    @Param('name') name: string,
    @Param('year', new ParseIntPipe()) year: number,
  ) {
    return this.tournamentService.points(type, name, year);
  }

  @Get(':name/:year/draws')
  draws(
    @Param('type') type: string,
    @Param('name') name: string,
    @Param('year', new ParseIntPipe()) year: number,
  ) {
    return this.tournamentService.draws(type, name, year);
  }

  @Get(':name/:year/past-champions')
  pastChampions(
    @Param('type') type: string,
    @Param('name') name: string,
    @Param('year', new ParseIntPipe()) year: number,
  ) {
    return this.tournamentService.pastChampions(type, name, year);
  }

  @Get(':name/:year')
  tournamentByYear(
    @Param('type') type: string,
    @Param('name') name: string,
    @Param('year', new ParseIntPipe()) year: number,
  ) {
    return this.tournamentService.tournamentByYear(type, name, year);
  }

  @Get(':name')
  years(@Param('type') type: string, @Param('name') name: string) {
    return this.tournamentService.years(type, name);
  }
}
