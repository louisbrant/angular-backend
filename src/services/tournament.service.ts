import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import { Connection, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PlayerAtp, PlayerWta } from 'src/modules/player/entity/player.entity';
import { GameAtp, GameWta } from 'src/modules/game/entity/game.entity';
import { SharedService } from 'src/services/shared.service';
import {
  TournamentAtp,
  TournamentWta,
} from 'src/modules/tournament/entity/tournament.entity';
import { PointPrize } from 'src/modules/points/entity/prize.entity';
import { TodayAtp, TodayWta } from 'src/modules/today/entity/today.entity';
import { H2hAtp, H2hWta } from 'src/modules/h2h/entity/h2h.entity';

@Injectable()
export class TournamentService {
  constructor(
    @InjectRepository(TournamentAtp)
    private tournamentAtpRepository: Repository<TournamentAtp>,
    @InjectRepository(TournamentWta)
    private tournamentWtaRepository: Repository<TournamentWta>,
    @InjectRepository(GameAtp)
    private gameAtpRepository: Repository<GameAtp>,
    @InjectRepository(GameWta)
    private gameWtaRepository: Repository<GameWta>,
    @InjectRepository(PlayerAtp)
    private playerAtpRepository: Repository<PlayerAtp>,
    @InjectRepository(PlayerWta)
    private playerWtaRepository: Repository<PlayerWta>,
    @InjectRepository(TodayAtp)
    private todayAtpRepository: Repository<TodayAtp>,
    @InjectRepository(TodayWta)
    private todayWtaRepository: Repository<TodayWta>,
    @InjectRepository(H2hAtp)
    private h2hAtpRepository: Repository<H2hAtp>,
    @InjectRepository(H2hWta)
    private h2hWtaRepository: Repository<H2hWta>,
    @InjectRepository(PointPrize)
    private pointRepository: Repository<PointPrize>,
    private sharedService: SharedService,
    private connection: Connection,
  ) {}

  public async tournamentByYear(type: string, name: string, year: number) {
    let tournamentRepository: Repository<TournamentAtp | TournamentWta>;
    if (type == 'atp') {
      tournamentRepository = this.tournamentAtpRepository;
    } else if (type == 'wta') {
      tournamentRepository = this.tournamentWtaRepository;
    } else {
      return { error: 'Wrong type!' };
    }

    const currentTournament = await tournamentRepository
      .createQueryBuilder('tournament')
      .where('LOWER(tournament.name) = :tournamentName', {
        tournamentName: name.toLowerCase(),
      })
      .andWhere('tournament.date BETWEEN :year and :nextYear', {
        year: `${year}-01-01`,
        nextYear: `${year}-12-31`,
      })
      .orderBy('tournament.date', 'DESC')
      .getOne();

    if (currentTournament?.id) {
      return tournamentRepository.findOne(
        {
          id: currentTournament.id,
        },
        {
          select: ['id', 'name', 'date', 'prize'],
          relations: ['court', 'rank', 'country'],
        },
      );
    }
  }

  public async years(type: string, name: string) {
    let tournamentRepository:
      | Repository<TournamentAtp>
      | Repository<TournamentWta>;
    if (type == 'atp') {
      tournamentRepository = this.tournamentAtpRepository;
    } else if (type == 'wta') {
      tournamentRepository = this.tournamentWtaRepository;
    } else {
      return { error: 'Wrong type!' };
    }

    const tournamentIds = await this.getTournamentIds(
      tournamentRepository,
      name,
      type,
    );

    const query = `select distinct extract(year from tour.date) as year, tour.name as name
                   from tournament_${type} tour
                   where tour.id in (${tournamentIds.toString()})
                   order by year`;
    return this.connection
      .query(query)
      .then((res) =>
        res.map((v) => ({ year: v.year, tournamentName: v.name })),
      );
  }

  public async points(type: string, name: string, year: number) {
    let tournamentRepository;
    if (type == 'atp') {
      tournamentRepository = this.tournamentAtpRepository;
    } else if (type == 'wta') {
      tournamentRepository = this.tournamentWtaRepository;
    } else {
      return { error: 'Wrong type!' };
    }

    const currentTournamentId = (
      await tournamentRepository
        .createQueryBuilder('tournament')
        .where('LOWER(tournament.name) = :tournamentName', {
          tournamentName: name.toLowerCase(),
        })
        .andWhere('tournament.date BETWEEN :year and :nextYear', {
          year: `${year}-01-01`,
          nextYear: `${year}-12-31`,
        })
        .orderBy('tournament.date', 'DESC')
        .getOne()
    )?.id;

    return tournamentRepository
      .createQueryBuilder('tournament')
      .select(['tournament.id'])
      .where('tournament.id = :tournamentId', {
        tournamentId: currentTournamentId,
      })
      .leftJoinAndSelect('tournament.rating', 'rating')
      .leftJoinAndSelect('tournament.singlesPrize', 'singles')
      .getOne()
      .then((tournament) => ({
        winner: {
          points: tournament.rating?.winner || null,
          prize: tournament.singlesPrize?.winner || null,
        },
        finalist: {
          points: tournament.rating?.finalist || null,
          prize: tournament.singlesPrize?.finalist || null,
        },
        semiFinalist: {
          points: tournament.rating?.semiFinalist || null,
          prize: tournament.singlesPrize?.semiFinalist || null,
        },
        quarterFinalist: {
          points: tournament.rating?.quarterFinalist || null,
          prize: tournament.singlesPrize?.quarterFinalist || null,
        },
        fourth: {
          points: tournament.rating?.fourth || null,
          prize: tournament.singlesPrize?.fourth || null,
        },
        third: {
          points: tournament.rating?.third || null,
          prize: tournament.singlesPrize?.third || null,
        },
        second: {
          points: tournament.rating?.second || null,
          prize: tournament.singlesPrize?.second || null,
        },
        first: {
          points: tournament.rating?.first || null,
          prize: tournament.singlesPrize?.first || null,
        },
        qualifying: {
          points: tournament.rating?.qualifying || null,
          prize: tournament.singlesPrize?.qualifying || null,
        },
        qualifyingSecond: {
          points: tournament.rating?.qualifyingSecond || null,
          prize: tournament.singlesPrize?.qualifyingSecond || null,
        },
        qualifyingFirst: {
          points: tournament.rating?.qualifyingFirst || null,
          prize: tournament.singlesPrize?.qualifyingFirst || null,
        },
        preQualifying: {
          points: tournament.rating?.preQualifying || null,
          prize: tournament.singlesPrize?.preQualifying || null,
        },
      }));
  }

  public async mostVictories(type: string, name: string) {
    let playerRepository: Repository<PlayerAtp> | Repository<PlayerWta>;
    let tournamentRepository:
      | Repository<TournamentAtp>
      | Repository<TournamentWta>;
    if (type == 'atp') {
      playerRepository = this.playerAtpRepository;
      tournamentRepository = this.tournamentAtpRepository;
    } else if (type == 'wta') {
      playerRepository = this.playerWtaRepository;
      tournamentRepository = this.tournamentWtaRepository;
    } else {
      return { error: 'Wrong type!' };
    }

    const tournamentIds = await this.getTournamentIds(
      tournamentRepository,
      name,
      type,
    );

    return playerRepository
      .createQueryBuilder('player')
      .leftJoin('player.gamesWinner', 'gamesWinner', 'gamesWinner.round = 12')
      .leftJoin('gamesWinner.tournament', 'winnerTournament')
      .where('winnerTournament.id in (:...tournamentIds)', { tournamentIds })
      .andWhere("player.name not like '%/%'")
      .andWhere("player.name != 'Unknown Player'")
      .select('player.country', 'countryAcr')
      .addSelect('player.id', 'id')
      .addSelect('COUNT(DISTINCT(gamesWinner.id))::int', 'wins')
      .addSelect('player.name', 'name')
      .orderBy('wins', 'DESC')
      .groupBy('player.id')
      .limit(5)
      .getRawMany()
      .then((res) => {
        return res.map((player) => ({
          ...player,
          image: this.sharedService.getPlayerImage(type, player.id),
        }));
      });
  }

  public async draws(type: string, name: string, year: number) {
    let gameRepository;
    let todayRepository;
    let h2hRepository;
    let statEntity;
    let h2hEntity;
    if (type == 'atp') {
      gameRepository = this.gameAtpRepository;
      todayRepository = this.todayAtpRepository;
      h2hRepository = this.h2hAtpRepository;
      statEntity = 'StatAtp';
      h2hEntity = 'H2hAtp';
    } else if (type == 'wta') {
      gameRepository = this.gameWtaRepository;
      todayRepository = this.todayWtaRepository;
      h2hRepository = this.h2hWtaRepository;
      statEntity = 'StatWta';
      h2hEntity = 'H2hWta';
    } else {
      return { error: 'Wrong type!' };
    }

    const currentGame = await gameRepository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.tournament', 'tournament')
      .where('LOWER(tournament.name) = :tournamentName', {
        tournamentName: name.toLowerCase(),
      })
      .andWhere(
        '((game.date BETWEEN :year and :nextYear) or (tournament.date BETWEEN :year and :nextYear))',
        {
          year: `${year}-01-01`,
          nextYear: `${year}-12-31`,
        },
      )
      .orderBy('game.date', 'DESC')
      .getOne();

    let currentTournamentId = 0;
    if (currentGame) currentTournamentId = currentGame.tournament.id;
    else
      return {
        singles: [],
        qualifying: [],
        doubles: [],
      };

    return gameRepository
      .createQueryBuilder('game')
      .leftJoin('game.player1', 'player1')
      .leftJoin('game.player2', 'player2')
      .innerJoin(
        'game.tournament',
        'tournament',
        'tournament.id = :tournamentId',
        {
          tournamentId: currentTournamentId,
        },
      )
      .leftJoinAndMapOne(
        'game.stats',
        statEntity,
        'stats',
        'stats.player1 = game.player1 and stats.player2 = game.player2 and stats.tournament = tournament.id',
      )
      .leftJoinAndMapOne(
        'game.h2h',
        h2hEntity,
        'h2h',
        'h2h.player1 = game.player1 and h2h.player2 = game.player2',
      )
      .addSelect(['player1.id', 'player1.name', 'player1.countryAcr'])
      .addSelect(['player2.id', 'player2.name', 'player2.countryAcr'])
      .addSelect(['tournament.id', 'tournament.name'])
      .getMany()
      .then(async (games: any) => {
        const todayGames: GameAtp[] | GameWta[] | any = await todayRepository
          .createQueryBuilder('game')
          .leftJoin('game.player1', 'player1')
          .leftJoin('game.player2', 'player2')
          .innerJoin(
            'game.tournament',
            'tournament',
            'tournament.id = :tournamentId',
            {
              tournamentId: currentTournamentId,
            },
          )
          .leftJoinAndMapOne(
            'game.stats',
            statEntity,
            'stats',
            'stats.player1 = game.player1 and stats.player2 = game.player2 and stats.tournament = tournament.id',
          )
          .leftJoinAndMapOne(
            'game.h2h',
            h2hEntity,
            'h2h',
            'h2h.player1 = game.player1 and h2h.player2 = game.player2',
          )
          .addSelect(['player1.id', 'player1.name', 'player1.countryAcr'])
          .addSelect(['player2.id', 'player2.name', 'player2.countryAcr'])
          .addSelect(['tournament.id', 'tournament.name'])
          .orderBy('game.date', 'DESC')
          .getMany();

        games = [
          ...games.filter(
            (game) =>
              todayGames.find(
                (today) =>
                  game.draw == today.draw &&
                  game.roundId == today.roundId &&
                  game.tournamentId == today.tournamentId,
              ) == -1 || todayGames.length == 0,
          ),
          ...todayGames,
        ];

        const semiFinalsSingles = games.filter(
          (game) => game.roundId == 10 && !game.player1.name.includes('/'),
        );
        const finalsSingles = games.filter(
          (game) => game.roundId == 12 && !game.player1.name.includes('/'),
        );
        const semiFinalsDoubles = games.filter(
          (game) => game.roundId == 10 && game.player1.name.includes('/'),
        );
        const finalsDoubles = games.filter(
          (game) => game.roundId == 12 && game.player1.name.includes('/'),
        );
        if (semiFinalsSingles.length == 2 && finalsSingles.length == 0) {
          games.push({
            id: 0,
            roundId: 12,
            result: '',
            date: semiFinalsSingles[0].date,
            seed1: semiFinalsSingles[0].seed1,
            seed2: semiFinalsSingles[0].seed2,
            odd1: semiFinalsSingles[0].odd1,
            odd2: semiFinalsSingles[0].odd2,
            player1Id: semiFinalsSingles[0].player1Id,
            player2Id: semiFinalsSingles[1].player1Id,
            tournamentId: semiFinalsSingles[0].tournamentId,
            player1: semiFinalsSingles[0].player1,
            player2: semiFinalsSingles[1].player1,
            tournament: semiFinalsSingles[0].tournament,
            stats: null,
            h2h: await this.h2hAtpRepository.findOne({
              where: {
                player1Id: semiFinalsSingles[0].player1Id,
                player2Id: semiFinalsSingles[1].player1Id,
              },
            }),
          });
        }
        if (semiFinalsDoubles.length == 2 && finalsDoubles.length == 0) {
          games.push({
            id: 0,
            roundId: 12,
            result: '',
            date: semiFinalsDoubles[0].date,
            seed1: semiFinalsDoubles[0].seed1,
            seed2: semiFinalsDoubles[0].seed2,
            odd1: semiFinalsDoubles[0].odd1,
            odd2: semiFinalsDoubles[0].odd2,
            player1Id: semiFinalsDoubles[0].player1Id,
            player2Id: semiFinalsDoubles[1].player1Id,
            tournamentId: semiFinalsDoubles[0].tournamentId,
            player1: semiFinalsDoubles[0].player1,
            player2: semiFinalsDoubles[1].player1,
            tournament: semiFinalsDoubles[0].tournament,
            stats: null,
            h2h: await this.h2hAtpRepository.findOne({
              where: {
                player1Id: semiFinalsDoubles[0].player1Id,
                player2Id: semiFinalsDoubles[1].player1Id,
              },
            }),
          });
        }

        const gamesMapped = games
          .sort((a, b) => a.draw - b.draw)
          .filter((game) => game.player1Id != game.player2Id)
          .map((game: GameAtp | GameWta | any) => ({
            ...game,
            id: undefined,
            stats: undefined,
            h2h: game.h2h
              ? `${game.h2h.player1Wins}-${game.h2h.player2Wins}`
              : null,
            ...this.mapGameStats(type, game),
          }));

        const qualifying = gamesMapped.filter((game) =>
          [3, 2, 1, 0].includes(game.roundId),
        );
        const doubles = gamesMapped.filter(
          (game) =>
            ![3, 2, 1, 0].includes(game.roundId) &&
            game.player1.name.indexOf('/') != -1,
        );
        const singles = gamesMapped.filter(
          (game) =>
            ![3, 2, 1, 0].includes(game.roundId) &&
            game.player1.name.indexOf('/') == -1,
        );

        const playerIdsInSecondRound = new Set();
        const playerIdsInFirstRound = new Set();
        for (const match of singles.filter((match) => match.roundId == 5)) {
          playerIdsInSecondRound.add(match.player1.id);
          playerIdsInSecondRound.add(match.player2.id);
        }
        for (const match of singles.filter((match) => match.roundId == 4)) {
          playerIdsInFirstRound.add(match.player1.id);
          playerIdsInFirstRound.add(match.player2.id);
        }
        const playerByeIds = [
          ...new Set(
            [...playerIdsInSecondRound].filter(
              (x) => !playerIdsInFirstRound.has(x),
            ),
          ),
        ];
        const players = playerByeIds.map((id) => {
          const matchWithPlayer = singles.find(
            (match) => match.player1.id == id || match.player2.id == id,
          );
          return matchWithPlayer.player1.id == id
            ? matchWithPlayer.player1
            : matchWithPlayer.player2;
        });
        for (const player of players) {
          singles.push({
            roundId: 4,
            result: '',
            date: '',
            tournamentId: singles[0].tournamentId,
            tournament: singles[0].tournament,
            h2h: '',
            player1: player,
            player2: null,
          });
        }
        //clear appointed pairs singles
        const singlesClear = [];
        singles.forEach((game) => {
          if (
            singles.filter(
              (item) => game.draw == item.draw && game.roundId == item.roundId,
            ).length > 1
          ) {
            if (
              game.player1?.name == 'Unknown Player' ||
              game.player2?.name == 'Unknown Player'
            ) {
              //console.log('skip')
            } else if (
              singles.filter(
                (item) =>
                  game.player1?.name == item.player2?.name &&
                  game.draw == item.draw &&
                  game.roundId == item.roundId,
              ).length > 0 &&
              game.result == ''
            ) {
              //console.log('skip')
            } else {
              singlesClear.push(game);
              //console.log('push')
            }
          } else {
            singlesClear.push(game);
          }
        });

        return {
          singles: singlesClear,
          qualifying: qualifying,
          doubles: doubles,
        };
      });
  }

  public async pastChampions(type: string, name: string, year: number) {
    let gameRepository: Repository<GameAtp> | Repository<GameWta>;
    let h2hEntity: 'H2hAtp' | 'H2hWta' = 'H2hAtp';
    let statEntity: 'StatAtp' | 'StatWta' = 'StatAtp';
    let tournamentRepository:
      | Repository<TournamentAtp>
      | Repository<TournamentWta>;
    if (type == 'atp') {
      gameRepository = this.gameAtpRepository;
      tournamentRepository = this.tournamentAtpRepository;
    } else if (type == 'wta') {
      statEntity = 'StatWta';
      h2hEntity = 'H2hWta';
      gameRepository = this.gameWtaRepository;
      tournamentRepository = this.tournamentWtaRepository;
    } else {
      return { error: 'Wrong type!' };
    }

    const tournamentIds = await this.getTournamentIds(
      tournamentRepository,
      name,
      type,
      year,
    );
    const singlesChampions = await gameRepository
      .createQueryBuilder('game')
      .leftJoin('game.player1', 'player1')
      .leftJoin('game.player2', 'player2')
      .innerJoin(
        'game.tournament',
        'tournament',
        'tournament.id in (:...tournamentIds)',
        { tournamentIds, year: `${year}-12-31` },
      )
      .leftJoinAndMapOne(
        'game.stats',
        `${statEntity}`,
        'stats',
        'stats.player1 = player1.id and stats.player2 = player2.id and stats.tournament = tournament.id',
      ).leftJoinAndMapOne(
            'game.h2h',
            h2hEntity,
            'h2h',
            '(h2h.player1 = player1.id and h2h.player2 = player2.id)',
        )
      .where('game.round = 12')
      .andWhere("player1.name not like '%/%'")
      .addSelect(['player1.id', 'player1.name', 'player1.countryAcr'])
      .addSelect(['player2.id', 'player2.name', 'player2.countryAcr'])
      .addSelect(['tournament.id', 'tournament.name', 'tournament.date'])
      .orderBy('tournament.date', 'DESC')
      .addOrderBy('game.date', 'DESC')
      .getMany()
      .then((games: any) =>
        games.map((game: GameAtp | GameWta | any) => ({
          ...game,
          id: undefined,
          stats: undefined,
          odd1: undefined,
          odd2: undefined,
          seed1: undefined,
          seed2: undefined,
          ...this.mapGameStats(type, game),
          h2h:
              (game.h2h?.player1Wins || 0) + '-' + (game.h2h?.player2Wins || 0),
        })),
      );

    const doublesChampions = await gameRepository
      .createQueryBuilder('game')
      .leftJoin('game.player1', 'player1')
      .leftJoin('game.player2', 'player2')
      .innerJoin(
        'game.tournament',
        'tournament',
        'tournament.id in (:...tournamentIds) and (tournament.date <= :year or game.date <= :year)',
        { tournamentIds, year: `${year}-12-31` },
      )
      .leftJoinAndMapOne(
        'game.stats',
        `${statEntity}`,
        'stats',
        'stats.player1 = player1.id and stats.player2 = player2.id and stats.tournament = tournament.id',
      )
      .where('game.round = 12')
      .andWhere("player1.name like '%/%'")
      .addSelect(['player1.id', 'player1.name', 'player1.countryAcr'])
      .addSelect(['player2.id', 'player2.name', 'player2.countryAcr'])
      .addSelect(['tournament.id', 'tournament.name', 'tournament.date'])
      .orderBy('tournament.date', 'DESC')
      .addOrderBy('game.date', 'DESC')
      .getMany()
      .then((games: any) =>
        games.map((game: GameAtp | GameWta | any) => ({
          ...game,
          id: undefined,
          stats: undefined,
          odd1: undefined,
          odd2: undefined,
          seed1: undefined,
          seed2: undefined,
          ...this.mapGameStats(type, game),
        })),
      );

    return { singlesChampions, doublesChampions };
  }

  private mapGameStats(type: string, game: GameAtp | GameWta | any) {
    return {
      player1: {
        ...game.player1,
        seed: game.seed1,
        odd: parseFloat(game.odd1) || null,
        image: this.sharedService.getPlayerImage(type, game.player1.id),
        stats: game.stats
          ? {
              firstServe: game.stats?.firstServe1,
              firstServeOf: game.stats?.firstServeOf1,
              aces: game.stats?.aces1,
              doubleFaults: game.stats?.doubleFaults1,
              unforcedErrors: game.stats?.unforcedErrors1,
              winningOnFirstServe: game.stats?.winningOnFirstServe1,
              winningOnFirstServeOf: game.stats?.winningOnFirstServeOf1,
              winningOnSecondServe: game.stats?.winningOnSecondServe1,
              winningOnSecondServeOf: game.stats?.winningOnSecondServeOf1,
              winners: game.stats?.winners1,
              breakPointsConverted: game.stats?.breakPointsConverted1,
              breakPointsConvertedOf: game.stats?.breakPointsConvertedOf1,
              netApproaches: game.stats?.netApproaches1,
              netApproachesOf: game.stats?.netApproachesOf1,
              totalPointsWon: game.stats?.totalPointsWon1,
              fastestServe: game.stats?.fastestServe1,
              averageFirstServeSpeed: game.stats?.averageFirstServeSpeed1,
              averageSecondServeSpeed: game.stats?.averageSecondServeSpeed1,
            }
          : null,
      },
      player2: {
        ...game.player2,
        seed: game.seed2,
        odd: game.odd2,
        image: this.sharedService.getPlayerImage(type, game.player2.id),
        stats: game.stats
          ? {
              firstServe: game.stats?.firstServe2,
              firstServeOf: game.stats?.firstServeOf2,
              aces: game.stats?.aces2,
              doubleFaults: game.stats?.doubleFaults2,
              unforcedErrors: game.stats?.unforcedErrors2,
              winningOnFirstServe: game.stats?.winningOnFirstServe2,
              winningOnFirstServeOf: game.stats?.winningOnFirstServeOf2,
              winningOnSecondServe: game.stats?.winningOnSecondServe2,
              winningOnSecondServeOf: game.stats?.winningOnSecondServeOf2,
              winners: game.stats?.winners2,
              breakPointsConverted: game.stats?.breakPointsConverted2,
              breakPointsConvertedOf: game.stats?.breakPointsConvertedOf2,
              netApproaches: game.stats?.netApproaches2,
              netApproachesOf: game.stats?.netApproachesOf2,
              totalPointsWon: game.stats?.totalPointsWon2,
              fastestServe: game.stats?.fastestServe2,
              averageFirstServeSpeed: game.stats?.averageFirstServeSpeed2,
              averageSecondServeSpeed: game.stats?.averageSecondServeSpeed2,
            }
          : null,
      },
    };
  }

  private async getTournamentIds(
    repository: Repository<TournamentAtp> | Repository<TournamentWta>,
    name: string,
    type: 'atp' | 'wta',
    year?: number,
  ) {
    const tournament = await this.getTournament(
      repository,
      name,
      year,
      type
    ).getOne();

    const parents = (
      await this.getParentTournamentIds(repository, tournament?.id, type)
    ).map((tournamentId) => tournamentId.id);
    const children = (
      await this.getChildrenTournamentIds(repository, tournament.id, type)
    ).map((tournamentId) => tournamentId.id);

    return [...new Set([...parents, ...children])].sort((a, b) => b - a);
  }

  private getTournament(
    repository: Repository<TournamentAtp> | Repository<TournamentWta>,
    name: string,
    year?: number,
    type?: string
  ) {
    let response = repository
      .createQueryBuilder('tournament')
      .where('LOWER(tournament.name) = :tournamentName', {
        tournamentName: name.toLowerCase(),
      });
    if (year) {
      response = response.andWhere(
        'tournament.date BETWEEN :year and :nextYear',
        {
          year: `${year}-01-01`,
          nextYear: `${year}-12-31`,
        },
      );
    }
    return response;
  }

  private getParentTournamentIds(
    repository: Repository<TournamentAtp> | Repository<TournamentWta>,
    tournamentId: number,
    type: 'atp' | 'wta',
  ) {
    return repository.query(`
        WITH RECURSIVE c AS (
            SELECT ${tournamentId} link, ${tournamentId} id
            UNION ALL
            SELECT tour.link, tour.id
            FROM tournament_${type} tour
                     JOIN c ON c.link = tour.id
        )
        SELECT id FROM c;
    `);
  }

  private getChildrenTournamentIds(
    repository: Repository<TournamentAtp> | Repository<TournamentWta>,
    tournamentId: number,
    type: 'atp' | 'wta',
  ) {
    return repository.query(`
      WITH RECURSIVE c AS (
          SELECT ${tournamentId} id, ${tournamentId} link
          UNION ALL
          SELECT tour.id, tour.link
          FROM tournament_${type} tour
                   JOIN c ON c.id = tour.link
      )
      SELECT id FROM c;
    `);
  }
}
