import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository, Like } from 'typeorm';
import { PlayerAtp, PlayerWta } from 'src/modules/player/entity/player.entity';
import { SharedService } from 'src/services/shared.service';
import { GameAtp, GameWta } from 'src/modules/game/entity/game.entity';
import { RatingAtp, RatingWta } from 'src/modules/ratings/entity/rating.entity';
import {
  PlayerStatAtp,
  PlayerStatWta,
} from 'src/modules/player-stats/entity/player-stat.entity';
import { H2hAtp, H2hWta } from 'src/modules/h2h/entity/h2h.entity';
import { TodayAtp, TodayWta } from 'src/modules/today/entity/today.entity';
import { GameService } from 'src/services/game.service';
import { Round } from 'src/modules/round/entity/round.entity';
import { StatAtp, StatWta } from 'src/modules/stat/entity/stat.entity';
import { Rank } from 'src/modules/rank/entity/rank.entity';
import { MatchPlayedGameDto } from 'src/modules/game/dto/match-played-game.dto';
import { MatchStatPlayerDto } from 'src/modules/player/dto/match-stat-player.dto';
import { Court } from 'src/modules/court/entity/court.entity';
import { TourType } from '../modules/shared/middlewares/tour.middleware';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(PlayerAtp)
    private playerAtpRepository: Repository<PlayerAtp>,
    @InjectRepository(PlayerWta)
    private playerWtaRepository: Repository<PlayerWta>,
    @InjectRepository(PlayerStatAtp)
    private playerStatAtpRepository: Repository<PlayerStatAtp>,
    @InjectRepository(PlayerStatWta)
    private playerStatWtaRepository: Repository<PlayerStatWta>,
    @InjectRepository(GameAtp)
    private gameAtpRepository: Repository<GameAtp>,
    @InjectRepository(GameWta)
    private gameWtaRepository: Repository<GameWta>,
    @InjectRepository(RatingAtp)
    private ratingAtpRepository: Repository<RatingAtp>,
    @InjectRepository(RatingWta)
    private ratingWtaRepository: Repository<RatingWta>,
    @InjectRepository(H2hAtp)
    private h2hAtpRepository: Repository<H2hAtp>,
    @InjectRepository(H2hWta)
    private h2hWtaRepository: Repository<H2hWta>,
    @InjectRepository(TodayAtp)
    private todayAtpRepository: Repository<TodayAtp>,
    @InjectRepository(TodayWta)
    private todayWtaRepository: Repository<TodayWta>,
    @InjectRepository(StatAtp)
    private statAtpRepository: Repository<StatAtp>,
    @InjectRepository(StatWta)
    private statWtaRepository: Repository<StatWta>,
    @InjectRepository(Court)
    private courtRepository: Repository<Court>,
    @InjectRepository(Round)
    private roundRepository: Repository<Round>,
    @InjectRepository(Rank)
    private rankRepository: Repository<Rank>,
    private sharedService: SharedService,
    private gameService: GameService,
  ) {}

  public async information(name: string) {
    const playerResult = await this.getPlayerByName(name);
    const type = playerResult.type;
    const player = playerResult.player;

    let gameRepository: Repository<GameAtp> | Repository<GameWta> =
      this.gameAtpRepository;
    if (type == 'wta') gameRepository = this.gameWtaRepository;
    return {
      ...player,
      id: undefined,
      type: playerResult.type,
      image: this.sharedService.getPlayerImage(type, player.id),
      information: {
        ...player.information && player.information[0],
        plays: player.information && player.information[0]?.plays?.split(',')[0],
        backhand: player.information && player.information[0]?.plays
          ?.split(',')[1]
          ?.replace('Backhand', '')
          .trim(),
        playerStatus: await gameRepository
          .createQueryBuilder('game')
          .where('game.player1 = :playerId or game.player2 = :playerId', {
            playerId: player.id,
          })
          .andWhere('game.date is not null')
          .select('EXTRACT(year from game.date)', 'year')
          .distinctOn(['year'])
          .orderBy('year', 'DESC', 'NULLS LAST')
          .getRawOne()
          .then((lastGame: any) => {
            const currentYear = new Date().getFullYear();
            return currentYear - 2 > lastGame?.year ? 'Inactive' : 'Active';
          }),
      },
      finalYears: await gameRepository
        .createQueryBuilder('game')
        .where('game.roundId = 12')
        .andWhere('game.player1 = :playerId', { playerId: player.id })
        .andWhere('game.date is not null')
        .select('EXTRACT(year from game.date)', 'year')
        .distinctOn(['year'])
        .orderBy('year', 'DESC')
        .getRawMany()
        .then((years) => years.map((year) => year.year)),
    };
  }

  public async statistics(name: string) {
    function getPlayerByName(
      name: string,
      playerRepository: Repository<PlayerAtp> | Repository<PlayerWta>,
    ) {
      return playerRepository
        .createQueryBuilder('player')
        .where('player.name = :requestName', { requestName: name })
        .select(['player.id', 'player.currentRank'])
        .getOne()
        .then((player) => ({
          id: player?.id,
          currentRank: player?.currentRank,
        }));
    }

    let player = await getPlayerByName(name, this.playerAtpRepository);
    let playerId = player.id;
    let currentRank = player.currentRank;
    let gameRepository = this.gameAtpRepository;
    let ratingRepository = this.ratingAtpRepository;
    let playerStatRepository = this.playerStatAtpRepository;
    if (!playerId) {
      player = await getPlayerByName(name, this.playerWtaRepository);
      playerId = player.id;
      currentRank = player.currentRank;
      gameRepository = this.gameWtaRepository;
      ratingRepository = this.ratingWtaRepository;
      playerStatRepository = this.playerStatWtaRepository;
    }
    if (!playerId) {
      return { err: 'Player not found' };
    }

    const recentGames = await this.recentGame(playerId, gameRepository)
      .getMany()
      .then((games) =>
        games
          .map((game) => (game.player1.id == playerId ? 'w' : 'l'))
          .reverse(),
      );

    const bestRank = await this.bestRank(playerId, ratingRepository);
    const playerStat = await this.getPlayerStat(playerId, playerStatRepository);
    return {
      recentGames,
      currentRank,
      bestRank: bestRank,
      ...playerStat,
      totalTitles: await this.getYtdTitles(
        playerId,
        gameRepository,
        true,
      ),
    };
  }

  public async interestingH2h(name: string) {
    const playerResult = await this.getPlayerByName(name);
    const type = playerResult.type;
    const player = playerResult.player;

    let h2hRepository: Repository<H2hAtp> | Repository<H2hWta>;
    if (type == 'atp') {
      h2hRepository = this.h2hAtpRepository;
    } else {
      h2hRepository = this.h2hWtaRepository;
    }

    return h2hRepository
      .createQueryBuilder('h2h')
      .leftJoin('h2h.player2', 'player2')
      .where('h2h.player1 = :playerId', { playerId: player.id })
      .addSelect(['player2.name'])
      .addSelect('(h2h.player1Wins + h2h.player2Wins)', 'wins')
      .limit(12)
      .orderBy('wins', 'DESC')
      .getMany()
      .then((h2hArray) =>
        h2hArray.map((h2h) => ({
          h2h: h2h.player1Wins + '-' + h2h.player2Wins,
          opponent: h2h.player2.name,
        })),
      );
  }

  public async upcomingMatches(name: string) {
    const playerResult = await this.getPlayerByName(name);
    const type = playerResult.type;
    const player = playerResult.player;

    let todayRepository: Repository<TodayAtp> | Repository<TodayWta>;
    let h2hEntity = '';
    if (type == 'atp') {
      todayRepository = this.todayAtpRepository;
      h2hEntity = 'H2hAtp';
    } else {
      todayRepository = this.todayWtaRepository;
      h2hEntity = 'H2hWta';
    }

    return todayRepository
      .createQueryBuilder('today')
      .leftJoinAndSelect('today.player1', 'player1')
      .leftJoinAndSelect('today.player2', 'player2')
      .leftJoin('today.tournament', 'tournament')
      .leftJoinAndMapOne(
        'today.h2h',
        h2hEntity,
        'h2h',
        '(h2h.player1 = player1.id and h2h.player2 = player2.id) or (h2h.player1 = player2.id and h2h.player2 = player1.id)',
      )
      .select([
        'today.id',
        'today.date',
        'today.roundId',
        'today.seed1',
        'today.seed2',
        'today.odd1',
        'today.odd2',
        'player1.id',
        'player1.name',
        'player1.countryAcr',
        'player2.id',
        'player2.name',
        'player2.countryAcr',
        'tournament.name',
        'tournament.date',
        'tournament.id',
        'h2h.player1Wins',
        'h2h.player2Wins',
      ])
      .where('today.complete is null')
      .andWhere("today.result=''")
      .andWhere('today.live is null')
      .andWhere('(today.player1 = :playerId or today.player2 = :playerId)', {
        playerId: player.id,
      })
      .getMany()
      .then((todayArray) => {
        return todayArray.map((today: TodayAtp | TodayWta | any) => ({
          tournament: today.tournament,
          roundId: today.roundId,
          player1: {
            name: today.player1.name,
            seed: today.seed1,
            odd: today.odd1,
            countryAcr: today.player1.countryAcr,
            image: this.sharedService.getPlayerImage(type, today.player1.id),
          },
          player2: {
            name: today.player2.name,
            seed: today.seed2,
            odd: today.odd2,
            countryAcr: today.player2.countryAcr,
            image: this.sharedService.getPlayerImage(type, today.player2.id),
          },
          h2h:
            (today.h2h?.player1Wins || 0) + '-' + (today.h2h?.player2Wins || 0),
        }));
      });
  }

  public async breakdown(name: string) {
    const playerResult = await this.getPlayerByName(name);
    const type = playerResult.type;
    const player = playerResult.player;

    let playerStatRepository:
      | Repository<PlayerStatAtp>
      | Repository<PlayerStatWta> = this.playerStatAtpRepository;
    if (type == 'wta') {
      playerStatRepository = this.playerStatWtaRepository;
    }

    return playerStatRepository
      .createQueryBuilder('stat')
      .where('stat.player = :playerId', { playerId: player.id })
      .getOne()
      .then((stat) => {
        let result: any[] = [];
        if (stat != undefined) {
          result = JSON.parse(stat.data);

          result['career'] = Object.values(result).reduce((prev, actual) => {
            const wlResult = (key) => {
              return Object.values({
                ...Object.keys(actual[key]).map((objKey) => {
                  const obj = {};
                  obj[objKey] = {
                    w:
                      (prev[key][objKey]?.w ?? 0) +
                      (actual[key][objKey]?.w ?? 0),
                    l:
                      (prev[key][objKey]?.l ?? 0) +
                      (actual[key][objKey]?.l ?? 0),
                  };
                  return obj;
                }),
              }).reduce((prev, current) => ({
                ...prev,
                ...current,
              }));
            };

            const court = wlResult('court');
            const round = wlResult('round');
            const rank = wlResult('rank');
            const level = wlResult('level');
            const levelFinals = wlResult('levelFinals');

            const temp = {
              court: {
                ...prev['court'],
                ...court,
              },
              round: {
                ...prev['round'],
                ...round,
              },
              rank: {
                ...prev['rank'],
                ...rank,
              },
              level: {
                ...prev['level'],
                ...level,
              },
              levelFinals: {
                ...prev['levelFinals'],
                ...levelFinals,
              },
            };

            return temp;
          });
        }
        return result;
      });
  }

  public async surfaceSummary(name: string) {
    const playerResult = await this.getPlayerByName(name);
    const type = playerResult.type;
    const player = playerResult.player;

    let gameRepository: Repository<GameAtp> | Repository<GameWta> =
      this.gameAtpRepository;
    if (type == 'wta') {
      gameRepository = this.gameWtaRepository;
    }

    return gameRepository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.tournament', 'tournament')
      .leftJoinAndSelect('tournament.court', 'court')
      .where('(game.player1 = :playerId or game.player2 = :playerId)', {
        playerId: player.id,
      })
      .andWhere('tournament.rank != 0')
      .andWhere('tournament.rank != 1')
      .andWhere('tournament.rank != 6')
      .andWhere('game.roundId != 0')
      .andWhere('game.roundId != 1')
      .andWhere('game.roundId != 2')
      .andWhere('game.roundId != 3')
      .andWhere('game.result is not null')
      .andWhere('game.date is not null')
      .andWhere("game.result != 'w/o'")
      .andWhere("game.result != 'bye'")
      .andWhere("game.result != ''")
      .orderBy('game.date', 'DESC')
      .getMany()
      .then((games: GameAtp[] | GameWta[]) => {
        const response = [];
        const years = new Set();
        for (const game of games) {
          years.add(game.date.getFullYear());
        }
        for (const year of years.values()) {
          let clayWin = 0;
          let clayLose = 0;
          let hardWin = 0;
          let hardLose = 0;
          let ihardWin = 0;
          let ihardLose = 0;
          let grassWin = 0;
          let grassLose = 0;

          for (const game of games.filter(
            (game) => game.date.getFullYear() == year,
          )) {
            if (game.tournament.courtId == 2) {
              if (game.player1Id == player.id) clayWin += 1;
              if (game.player2Id == player.id) clayLose += 1;
            }
            if (game.tournament.courtId == 3 || game.tournament.courtId == 4) {
              if (game.player1Id == player.id) ihardWin += 1;
              if (game.player2Id == player.id) ihardLose += 1;
            }
            if (game.tournament.courtId == 5) {
              if (game.player1Id == player.id) grassWin += 1;
              if (game.player2Id == player.id) grassLose += 1;
            }
            if (game.tournament.courtId == 1) {
              if (game.player1Id == player.id) hardWin += 1;
              if (game.player2Id == player.id) hardLose += 1;
            }
          }

          const sumWins = clayWin + hardWin + ihardWin + grassWin;
          const sumLosses = clayLose + hardLose + ihardLose + grassLose;
          response.push({
            year: year,
            sum: { w: sumWins, l: sumLosses },
            hard: { w: hardWin, l: hardLose },
            ihard: { w: ihardWin, l: ihardLose },
            clay: { w: clayWin, l: clayLose },
            grass: { w: grassWin, l: grassLose },
          });
        }
        return response;
      });
  }

  public async matchesPlayed(name: string, query: MatchPlayedGameDto) {
    const playerResult = await this.getPlayerByName(name);
    const type = playerResult.type;
    const player = playerResult.player;

    let gameRepository: Repository<GameAtp> | Repository<GameWta> =
      this.gameAtpRepository;
    let h2hEntity: 'H2hAtp' | 'H2hWta' = 'H2hAtp';
    let statEntity: 'StatAtp' | 'StatWta' = 'StatAtp';
    if (type == 'wta') {
      gameRepository = this.gameWtaRepository;
      h2hEntity = 'H2hWta';
      statEntity = 'StatWta';
    }

    let response = await gameRepository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.player1', 'player1')
      .leftJoinAndSelect('game.player2', 'player2')
      .leftJoinAndSelect('game.tournament', 'tournament')
      .leftJoinAndMapOne(
        'game.h2h',
        h2hEntity,
        'h2h',
        '(h2h.player1 = player1.id and h2h.player2 = player2.id)',
      )
      .leftJoinAndMapOne(
        'game.stats',
        statEntity,
        'stats',
        'stats.player1 = game.player1 and stats.player2 = game.player2 and stats.tournament = tournament.id',
      )
      .where('(game.player1Id = :playerId or game.player2Id = :playerId)', {
        playerId: player.id,
      })
      .andWhere('game.date is not null')
      .andWhere('game.result is not null')
      .andWhere("game.result != ''")
      .orderBy('game.date', 'DESC');

    if (query?.level) {
      if (query.level == 3) {
        response = response
          .leftJoin('tournament.rank', 'rank')
          .andWhere(
            `rank.id = :rankFilter and tournament.name not like '%ATP Finals%'`,
            {
              rankFilter: query.level,
            },
          );
      } else {
        response = response
          .leftJoin('tournament.rank', 'rank')
          .andWhere('rank.id = :rankFilter', {
            rankFilter: query.level,
          });
      }
    }

    response = response.leftJoinAndSelect('tournament.court', 'court');
    if (query?.court) {
      response = response.andWhere('LOWER(court.name) in (:...courtFilter)', {
        courtFilter: query.court.split(',').map((name) => name.toLowerCase()),
      });
    }

    if (query?.year) {
      if (parseInt(query?.year)) {
        let monthDayEnd = new Date(`${query.year.toString()}-12-31`);
        if (query?.week) {
          const endDate: any = new Date(query.year.toString());
          endDate.setDate(endDate.getDate() + 7 * query.week);
          monthDayEnd = endDate;
        }
        response = response.andWhere('game.date <= :nextYearFilter', {
          nextYearFilter: monthDayEnd,
        });
      }
    }

    if (query?.round) {
      response = response
        .leftJoinAndSelect('game.round', 'round')
        .andWhere('LOWER(round.name) = LOWER(:roundFilter)', {
          roundFilter: query.round,
        });
    }

    if (!query?.limit) {
      query.limit = 10;
    }

    return response
      .limit(query.limit)
      .offset(query.limit * ((query?.page || 1) - 1))
      .getMany()
      .then(async (games) => {
        const gamesMapped = games.map((game: GameAtp | GameWta | any) => ({
          ...game,
          id: undefined,
          stats: undefined,
          odd1: undefined,
          odd2: undefined,
          seed1: undefined,
          seed2: undefined,
          ...this.gameService.mapGameStats(type, game),
          h2h:
            (game.h2h?.player1Wins || 0) + '-' + (game.h2h?.player2Wins || 0),
        }));

        const qualifying = gamesMapped.filter((game) =>
          [3, 2, 1, 0].includes(game.round),
        );
        const doubles = gamesMapped.filter(
          (game) => game.player1.name.indexOf('/') != -1,
        );
        const singles = gamesMapped.filter(
          (game) =>
            ![3, 2, 1, 0].includes(game.round) &&
            game.player1.name.indexOf('/') == -1,
        );
        return {
          singles: singles,
          doubles: doubles,
          qualifying: qualifying,
          singlesCount: await response.getCount(),
        };
      });
  }

  public async profileFilters(name: string) {
    const playerResult = await this.getPlayerByName(name);
    const type = playerResult.type;
    const player = playerResult.player;

    let gameRepository: Repository<GameAtp> | Repository<GameWta> =
      this.gameAtpRepository;
    if (type == 'wta') {
      gameRepository = this.gameWtaRepository;
    }

    return {
      courts: await this.courtRepository.find(),
      rounds: await this.getRounds(),
      level: await this.rankRepository.find(),
      years: await gameRepository
        .createQueryBuilder('game')
        .where('game.player1 = :playerId or game.player2 = :playerId', {
          playerId: player.id,
        })
        .andWhere('game.date is not null')
        .select('EXTRACT(year from game.date)', 'year')
        .distinctOn(['year'])
        .orderBy('year', 'DESC')
        .getRawMany()
        .then((games: any) => [
          'Career',
          ...games.map((game) => game.year).filter((game) => game),
        ]),
    };
  }

  public async getRounds() {
    return await this.roundRepository.find().then((rounds) => {
      function findRoundByName(name: string) {
        return rounds.find((round) => round.name.toLowerCase() == name);
      }

      const filteredPart = [
        findRoundByName('final'),
        findRoundByName('1/2'),
        findRoundByName('1/4'),
        findRoundByName('first'),
        findRoundByName('second'),
        findRoundByName('third'),
        findRoundByName('fourth'),
        findRoundByName('qualifying'),
        findRoundByName('q-first'),
        findRoundByName('q-second'),
        findRoundByName('pre-q'),
        findRoundByName('rubber 1'),
        findRoundByName('rubber 2'),
        findRoundByName('rubber 3'),
        findRoundByName('rubber 4'),
        findRoundByName('rubber 5'),
        findRoundByName('robin'),
        findRoundByName('bronze'),
      ];

      return Array.from(new Set([...filteredPart, ...rounds]));
    });
  }

  public async finals(name: string, year: number) {
    const playerResult = await this.getPlayerByName(name);
    const type = playerResult.type;
    const player = playerResult.player;

    let gameRepository: Repository<GameAtp> | Repository<GameWta> =
      this.gameAtpRepository;
    if (type == 'wta') gameRepository = this.gameWtaRepository;

    return gameRepository
      .createQueryBuilder('game')
      .where('game.roundId = 12')
      .andWhere('(game.player1 = :playerId or game.player2 = :playerId)', {
        playerId: player.id,
      })
      .andWhere('game.date is not null')
      .andWhere('tournament.date between :startYear and :endYear', {
        startYear: `${year}-01-01`,
        endYear: `${year}-12-31`,
      })
      .leftJoinAndSelect('game.tournament', 'tournament')
      .leftJoinAndSelect('tournament.court', 'court')
      .leftJoinAndSelect('tournament.country', 'country')
      .getMany()
      .then((games) => {
        const gamesMapper: any = games.map((game) => ({
          court: game.tournament.court.name,
          country: game.tournament.country,
          name: game.tournament.name,
          date: game.tournament.date,
          rankId: game.tournament.rankId,
          player1Id: game.player1Id,
          player2Id: game.player2Id,
        }));
        const titles = gamesMapper
          .filter(
            (game) =>
              game.player1Id == player.id &&
              [2, 3, 4, 7, 8, 9].indexOf(game.rankId) > -1,
          )
          .map((game) => ({
            ...game,
            player1Id: undefined,
            player2Id: undefined,
          }));
        const finals = gamesMapper
          .filter((game) => game.player1Id == player.id && game.rankId == 7)
          .map((game) => ({
            ...game,
            player1Id: undefined,
            player2Id: undefined,
          }));
        return { titles, finals };
      });
  }

  public async matchStats(
    name: string,
    year: number | string,
    params: MatchStatPlayerDto,
  ) {
    const playerResult = await this.getPlayerByName(name);
    const type = playerResult.type;
    const player = playerResult.player;

    let statRepository: Repository<StatAtp> | Repository<StatWta> =
      this.statAtpRepository;
    if (type == 'wta') statRepository = this.statWtaRepository;

    let response = statRepository
      .createQueryBuilder('stat')
      .leftJoin('stat.tournament', 'tournament')
      .leftJoin(
        'tournament.games',
        'games',
        '(games.player1Id = :playerId or games.player2Id = :playerId)',
        {
          playerId: player.id,
        },
      )
      .leftJoinAndSelect('tournament.court', 'court')
      .leftJoinAndSelect('tournament.rank', 'rank')
      .leftJoinAndSelect('games.round', 'round')
      .leftJoin('stat.player1', 'player1')
      .leftJoin('stat.player2', 'player2')
      .addSelect([
        'tournament.id',
        'tournament.name',
        'tournament.date',
        'tournament.countryAcr',
        'games.id',
        'games.roundId',
        'games.result',
        'games.player1Id',
        'games.player2Id',
        'player1.id',
        'player1.name',
        'player2.id',
        'player2.name',
      ])
      .where('(stat.player1 = :playerId or stat.player2 = :playerId)', {
        playerId: player.id,
      });

    if (parseInt(year as string)) {
      response = response.andWhere(
        `tournament.date BETWEEN :year and :nextYear`,
        {
          year: `${year}-01-01`,
          nextYear: `${year}-12-31`,
        },
      );
    }

    if (params?.level) {
      if (params.level == 3) {
        response = response.andWhere(
          `rank.id = :level and tournament.name not like '%ATP Finals%'`,
          { level: params.level },
        );
      } else {
        response = response.andWhere('rank.id = :level', {
          level: params.level,
        });
      }
    }
    if (params?.court) {
      response = response.andWhere('LOWER(court.name) in (:...court)', {
        court: params.court.split(',').map((name) => name.toLowerCase()),
      });
    }

    if (params?.round) {
      response = response.andWhere('round.name = :round', {
        round: params.round,
      });
    }
    return response.getMany().then((stats: StatWta[] | StatAtp[] | any) => {
      stats = stats
        .sort((a, b) => b.id - a.id)
        .filter((stat) => {
          stat.tournament.games = stat.tournament.games.filter(
            (game) =>
              (game.player1Id == stat.player1.id &&
                game.player2Id == stat.player2.id) ||
              (game.player2Id == stat.player1.id &&
                game.player1Id == stat.player2.id),
          );
          return stat.tournament.games.length > 0;
        });

      const sumStatPlayer = this.sumStatWinner.bind(this, stats, player.id);
      const sumStatOpponent = this.sumStatLoser.bind(this, stats, player.id);
      const winningOnFirstServe = sumStatPlayer('winningOnFirstServe');
      const winningOnFirstServeOf = sumStatPlayer('winningOnFirstServeOf');
      const winningOnSecondServe = sumStatPlayer('winningOnSecondServe');
      const winningOnSecondServeOf = sumStatPlayer('winningOnSecondServeOf');
      const winningBreakPointsConverted = sumStatPlayer('breakPointsConverted');
      const winningBreakPointsConvertedOf = sumStatPlayer(
        'breakPointsConvertedOf',
      );
      const opponentWinningOnFirstServe = sumStatOpponent(
        'winningOnFirstServe',
      );
      const opponentWinningOnFirstServeOf = sumStatOpponent(
        'winningOnFirstServeOf',
      );
      const opponentWinningOnSecondServe = sumStatOpponent(
        'winningOnSecondServe',
      );
      const opponentWinningOnSecondServeOf = sumStatOpponent(
        'winningOnSecondServeOf',
      );
      const opponentBreakPointsConverted = sumStatOpponent(
        'breakPointsConverted',
      );
      const opponentBreakPointsConvertedOf = sumStatOpponent(
        'breakPointsConvertedOf',
      );

      const games = stats
        .map((stat) => stat.tournament.games.length)
        .reduce((prev, current) => prev + current, 0);
      let playerWinsCountOnWin = 0;
      let opponentWinsCountOnWin = 0;
      for (const stat of stats as StatWta[] | StatAtp[]) {
        for (const game of stat.tournament.games) {
          let p1Wins = 0;
          let p2Wins = 0;
          for (const set of game.result.split(' ')) {
            p1Wins += parseInt(set.split('-')[0]?.split('(')[0]) || 0;
            p2Wins += parseInt(set.split('-')[1]?.split('(')[0]) || 0;
          }
          if (game.player1Id == player.id) {
            playerWinsCountOnWin += p1Wins;
            opponentWinsCountOnWin += p2Wins;
          } else {
            playerWinsCountOnWin += p2Wins;
            opponentWinsCountOnWin += p1Wins;
          }
        }
      }

      return {
        games: games,
        playerWins: playerWinsCountOnWin,
        opponentWins: opponentWinsCountOnWin,
        serviceStats: {
          acesGm: {
            value: sumStatPlayer('aces'),
            count: (playerWinsCountOnWin + opponentWinsCountOnWin) / 2,
          },
          doubleFaultsGm: {
            value: sumStatPlayer('doubleFaults'),
            count: (playerWinsCountOnWin + opponentWinsCountOnWin) / 2,
          },
          firstServe: {
            value: sumStatPlayer('firstServe'),
            count: sumStatPlayer('firstServeOf'),
          },
          winningOnFirstServe: {
            value: winningOnFirstServe,
            count: winningOnFirstServeOf,
          },
          winningOnSecondServe: {
            value: winningOnSecondServe,
            count: winningOnSecondServeOf,
          },
          srwPtsWin: {
            value: winningOnFirstServe + winningOnSecondServe,
            count: winningOnFirstServeOf + winningOnSecondServeOf,
          },
        },
        returnStats: {
          opponentAcesGm: {
            value: sumStatOpponent('aces'),
            count: (opponentWinsCountOnWin + playerWinsCountOnWin) / 2,
          },
          opponentDoubleFaultsGm: {
            value: sumStatOpponent('doubleFaults'),
            count: (opponentWinsCountOnWin + playerWinsCountOnWin) / 2,
          },
          opponentFirstServe: {
            value: sumStatOpponent('firstServe'),
            count: sumStatOpponent('firstServeOf'),
          },
          opponentWinningOnFirstServe: {
            value: opponentWinningOnFirstServeOf - opponentWinningOnFirstServe,
            count: opponentWinningOnFirstServeOf,
          },
          opponentWinningOnSecondServe: {
            value:
              opponentWinningOnSecondServeOf - opponentWinningOnSecondServe,
            count: opponentWinningOnSecondServeOf,
          },
          opponentSrwPtsWin: {
            value:
              opponentWinningOnFirstServeOf -
              opponentWinningOnFirstServe +
              opponentWinningOnSecondServeOf -
              opponentWinningOnSecondServe,
            count:
              opponentWinningOnFirstServeOf + opponentWinningOnSecondServeOf,
          },
        },
        breakPointsServe: {
          breakPointSavedGm: {
            value:
              opponentBreakPointsConvertedOf - opponentBreakPointsConverted,
            count: (opponentWinsCountOnWin + playerWinsCountOnWin) / 2,
          },
          breakPointFacedGm: {
            value: opponentBreakPointsConvertedOf,
            count: (opponentWinsCountOnWin + playerWinsCountOnWin) / 2,
          },
          breakPointSave: {
            value:
              opponentBreakPointsConvertedOf - opponentBreakPointsConverted,
            count: opponentBreakPointsConvertedOf,
          },
          serviceHold: {
            value:
              (opponentWinsCountOnWin + playerWinsCountOnWin) / 2 -
              opponentBreakPointsConverted,
            count: (opponentWinsCountOnWin + playerWinsCountOnWin) / 2,
          },
        },
        breakPointsRtn: {
          breakPointWonGm: {
            value: winningBreakPointsConverted,
            count: (opponentWinsCountOnWin + playerWinsCountOnWin) / 2,
          },
          breakPointChanceGm: {
            value: winningBreakPointsConvertedOf,
            count: (opponentWinsCountOnWin + playerWinsCountOnWin) / 2,
          },
          breakPointWon: {
            value: winningBreakPointsConverted,
            count: winningBreakPointsConvertedOf,
          },
          opponentHold: {
            value:
              (opponentWinsCountOnWin + playerWinsCountOnWin) / 2 -
              winningBreakPointsConverted,
            count: (opponentWinsCountOnWin + playerWinsCountOnWin) / 2,
          },
        },
      };
    });
  }

  public async searchProfiles(searchString: string, type: string) {
    searchString = searchString.toLowerCase();
    const playerRepo: Repository<PlayerAtp | PlayerWta> =
      type === TourType.ATP
        ? this.playerAtpRepository
        : this.playerWtaRepository;
    return playerRepo
      .createQueryBuilder('player')
      .select(['player.name'])
      .where(
        `lower(player.name) like '%${searchString}%' and player.name not like '%/%'`,
      )
      .getMany()
      .then((players) => players.map((player) => player.name));
  }

  private sumStatWinner(object: any, playerId: number, property: string) {
    return object
      .map((stat) =>
        stat.player1.id == playerId
          ? stat[property + '1']
          : stat[property + '2'],
      )
      .reduce((prev, current) => prev + current, 0);
  }

  private sumStatLoser(object: any, playerId: number, property: string) {
    return object
      .map((stat) =>
        stat.player1.id != playerId
          ? stat[property + '1']
          : stat[property + '2'],
      )
      .reduce((prev, current) => prev + current, 0);
  }

  private async getPlayerByName(name: string) {
    let type = 'atp';
    let player: PlayerAtp | PlayerWta | any = await this.getPlayer(
      name,
      this.playerAtpRepository,
    );
    if (!player.rating && !player.currentRank) {
      type = 'wta';
      player = await this.getPlayer(name, this.playerWtaRepository);
    }
    return { type, player };
  }

  private async getPlayerStat(
    playerId: number,
    playerStatRepository: Repository<PlayerStatAtp> | Repository<PlayerStatWta>,
  ) {
    return await playerStatRepository
      .createQueryBuilder('stat')
      .where('stat.player = :playerId', { playerId })
      .getOne()
      .then(async (playerStat) => {
        let stat = [];
        if (playerStat != undefined) {
          stat = JSON.parse(playerStat.data);
        }
        const mainTours = { wins: 0, losses: 0 };
        const tourFinals = { wins: 0, losses: 0 };
        const master = { wins: 0, losses: 0 };
        const grandSlam = { wins: 0, losses: 0 };
        const cups = { wins: 0, losses: 0 };
        const futures = { wins: 0, losses: 0 };
        const challengers = { wins: 0, losses: 0 };
        const total = { wins: 0, losses: 0 };
        const courts = {};
        let favouriteCourt: any[] = undefined;
        for (const year in stat) {
          const levelByYear = stat[year].levelFinals;
          const courtByYear = stat[year].court;
          mainTours.wins += levelByYear['mainTour']['w'] || 0;
          mainTours.losses += levelByYear['mainTour']['l'] || 0;
          tourFinals.wins += levelByYear['tourFinals']['w'] || 0;
          tourFinals.losses += levelByYear['tourFinals']['l'] || 0;
          master.wins += levelByYear['masters']['w'] || 0;
          master.losses += levelByYear['masters']['l'] || 0;
          grandSlam.wins += levelByYear['grandSlam']['w'] || 0;
          grandSlam.losses += levelByYear['grandSlam']['l'] || 0;
          cups.wins += levelByYear['cups']['w'] || 0;
          cups.losses += levelByYear['cups']['l'] || 0;
          futures.wins += levelByYear['futures']['w'] || 0;
          futures.losses += levelByYear['futures']['l'] || 0;
          challengers.wins += levelByYear['challengers']['w'] || 0;
          challengers.losses += levelByYear['challengers']['l'] || 0;
          total.wins += levelByYear['total']['w'] || 0;
          total.losses += levelByYear['total']['l'] || 0;

          for (const courtId in courtByYear) {
            courts[courtId] = {
              wins:
                (courts[courtId]?.wins || 0) + (courtByYear[courtId]['w'] || 0),
              losses:
                (courts[courtId]?.losses || 0) +
                (courtByYear[courtId]['l'] || 0),
              surfaceId: parseInt(courtId),
            };
          }
          favouriteCourt = courts['1'];
          for (const courtId in courts) {
            if (
              courts[courtId]['wins'] >
              (favouriteCourt && 'wins' in favouriteCourt
                ? favouriteCourt['wins']
                : 0)
            ) {
              favouriteCourt = courts[courtId];
            }
          }
        }
        if (favouriteCourt == undefined) {
          favouriteCourt = [];
          favouriteCourt['surfaceId'] = 10;
        }
        return {
          mainTours: mainTours.wins + '-' + mainTours.losses,
          tourFinals: tourFinals.wins + '-' + tourFinals.losses,
          master: master.wins + '-' + master.losses,
          grandSlam: grandSlam.wins + '-' + grandSlam.losses,
          cups: cups.wins + '-' + cups.losses,
          futures: futures.wins + '-' + futures.losses,
          challengers: challengers.wins + '-' + challengers.losses,
          total: total.wins + '-' + total.losses,
          favouriteCourt: {
            ...favouriteCourt,
            surface: await this.courtRepository
              .findOne({ where: { id: favouriteCourt['surfaceId'] } })
              .then((court) => court.name),
          },
        };
      });
  }

  private getPlayer(
    name: string,
    playerRepository: Repository<PlayerAtp> | Repository<PlayerWta>,
  ) {
    return playerRepository
      .createQueryBuilder('player')
      .leftJoin('player.information', 'info')
      .leftJoin('player.country', 'country')
      .select([
        'player.id',
        'player.name',
        'player.birthday',
        'info.turnedPro',
        'info.weight',
        'info.height',
        'info.birthplace',
        'info.residence',
        'info.plays',
        'info.coach',
        'info.site',
        'info.twitter',
        'info.instagram',
        'info.facebook',
        'info.playerStatus',
        'country.name',
        'country.acronym',
      ])
      .leftJoinAndSelect('player.rating', 'rating')
      .where('LOWER(player.name) = :name', { name: name.toLowerCase() })
      .getOne()
      .then((player) => ({
        ...player,
        rating: undefined,
        currentRank: player?.rating.sort(
          (a, b) => b.date.getTime() - a.date.getTime(),
        )[0]?.position,
      }));
  }

  private recentGame(
    playerId: number,
    gameRepository: Repository<GameAtp> | Repository<GameWta>,
  ) {
    return gameRepository
      .createQueryBuilder('game')
      .leftJoin('game.player1', 'player1')
      .leftJoin('game.player2', 'player2')
      .leftJoin('game.tournament', 'tour')
      .select([
        'game.id',
        'game.date',
        'player1.id',
        'player2.id',
        'player1.name',
        'player2.name',
      ])
      .where(
        '(player1.id = :playerId or player2.id = :playerId) and game.date is not null',
        { playerId: playerId },
      )
        .andWhere('tour.rank != 0')
        .andWhere('tour.rank != 1')
        .andWhere('tour.rank != 6')
        .andWhere('game.roundId != 0')
        .andWhere('game.roundId != 1')
        .andWhere('game.roundId != 2')
        .andWhere('game.roundId != 3')
        .andWhere('game.result is not null')
        .andWhere('game.date is not null')
        .andWhere("game.result != 'w/o'")
        .andWhere("game.result != 'bye'")
        .andWhere("game.result != ''")
      .limit(10)
      .orderBy('game.date', 'DESC');
  }

  private bestRank(
    id: number,
    ratingRepository: Repository<RatingAtp> | Repository<RatingWta>,
  ) {
    return ratingRepository
      .createQueryBuilder('rating')
      .where('rating.player = :playerId', { playerId: id })
      .orderBy('rating.position')
      .addOrderBy('rating.date', 'DESC')
      .getOne()
      .then((rating) => ({
        position: rating?.position,
        date: rating?.date,
      }));
  }

  private getYtdTitles(
    playerId: number,
    gameRepo: Repository<GameAtp> | Repository<GameWta>,
    allTime = false,
  ) {
    let year = 1980;
    if (allTime == false) {
      year = new Date().getFullYear();
    }
    const currentYear = new Date().getFullYear();
    return gameRepo
      .createQueryBuilder('game')
      .where('game.roundId = 12')
      .andWhere('tournament.rankId IN (2,3,4,7,8,9)')
      .andWhere('(game.player1 = :playerId)', {
        playerId,
      })
      .andWhere('game.date is not null')
      .andWhere('tournament.date between :startYear and :endYear', {
        startYear: `${year}-01-01`,
        endYear: `${currentYear}-12-31`,
      })
        .leftJoinAndSelect('game.tournament', 'tournament')
        .leftJoinAndSelect('tournament.court', 'court')
        .leftJoinAndSelect('tournament.country', 'country')
        .getCount();
  }
}
