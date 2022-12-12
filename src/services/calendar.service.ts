import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Connection, Repository } from 'typeorm';
import {
  TournamentAtp,
  TournamentWta,
} from 'src/modules/tournament/entity/tournament.entity';
import { Rank } from 'src/modules/rank/entity/rank.entity';
import { GameService } from 'src/services/game.service';
import { SharedService } from 'src/services/shared.service';
import { CalendarFilterDto } from 'src/modules/calendar/dto/calendar-filter.dto';
import { Court } from 'src/modules/court/entity/court.entity';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(TournamentAtp)
    private tournamentAtpRepository: Repository<TournamentAtp>,
    @InjectRepository(TournamentWta)
    private tournamentWtaRepository: Repository<TournamentWta>,
    @InjectRepository(Court)
    private courtRepository: Repository<Court>,
    @InjectRepository(Rank)
    private rankRepository: Repository<Rank>,
    private connection: Connection,
    private gameService: GameService,
    private sharedService: SharedService,
  ) {}

  findAll(type: string, year: number, queryParams: CalendarFilterDto) {
    let tournamentRepository: Repository<TournamentAtp | TournamentWta>;
    if (type == 'atp') {
      tournamentRepository = this.tournamentAtpRepository;
    } else if (type == 'wta') {
      tournamentRepository = this.tournamentWtaRepository;
    } else {
      return { error: 'Wrong type!' };
    }

    let query = tournamentRepository
      .createQueryBuilder('tournament')
      .select([
        'tournament.name',
        'tournament.date',
        'tournament.countryAcr',
        'tournament.prize',
        'court.name',
        'court.id',
        'rank.id',
        'rank.name',
        'player1.id',
        'player1.name',
        'player1.countryAcr',
        'player2.id',
        'player2.name',
        'player2.countryAcr',
      ])
      .leftJoin('tournament.court', 'court')
      .leftJoin('tournament.rank', 'rank')
      .leftJoinAndSelect(
        'tournament.games',
        'games',
        '(games.roundId = 12 or games.roundId is null)',
      )
      .leftJoin('games.player1', 'player1')
      .leftJoin('games.player2', 'player2')
      .leftJoinAndMapOne(
        'games.stats',
        'StatAtp',
        'stats',
        'stats.player1 = games.player1 and stats.player2 = games.player2 and stats.tournament = tournament.id',
      )
      .where(
        "(player1.name not like '%/%' or games.player1 is null) and (player2.name not like '%/%' or games.player2 is null)",
      )
      .andWhere(`tournament.date BETWEEN :year and :nextYear`, {
        year: `${year}-01-01`,
        nextYear: `${year}-12-31`,
      });

    if (queryParams?.surfaces)
      query = query.andWhere('LOWER(court.name) in (:...courtFilter)', {
        courtFilter: queryParams.surfaces
          .split(',')
          .map((name) => name.toLowerCase()),
      });

    if (queryParams?.search)
      query = query.andWhere(
        `LOWER(tournament.name) like '%${queryParams.search.toLowerCase()}%'`,
      );

    if (queryParams?.level) {
      if (queryParams.level == '3') {
        query = query.andWhere('rank.name = :queryLevel', {
          queryLevel: queryParams.level,
        });
      } else {
        query = query.andWhere('rank.name = :queryLevel', {
          queryLevel: queryParams.level,
        });
      }
    }

    return query.getMany().then((tournaments: any) => {
      return tournaments?.map((tournament) => ({
        ...tournament,
        games: tournament.games.map((game) => {
          const mapGameStats = this.gameService.mapGameStats(type, game);
          return {
            player1: {
              ...mapGameStats.player1,
              image: this.sharedService.getPlayerImage(type, game.player1.id),
              odd: undefined,
            },
            player2: {
              ...mapGameStats.player2,
              image: this.sharedService.getPlayerImage(type, game.player2.id),
              odd: undefined,
            },
          };
        }),
      }));
    });
  }

  async findFilters(type: string) {
    if (type != 'atp' && type != 'wta') {
      return { error: 'Wrong type!' };
    }
    const query = `select distinct extract(year from tour."date") as year from tournament_${type} tour order by year`;
    return {
      years: await this.connection
        .query(query)
        .then((res) => res.map((v) => v.year)),
      levels: await this.rankRepository.find(),
      surfaces: await this.courtRepository.find(),
    };
  }
}
