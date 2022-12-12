import { Injectable } from '@nestjs/common';
import { Connection, Repository } from 'typeorm';
import { GameAtp, GameWta } from 'src/modules/game/entity/game.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { H2hAtp, H2hWta } from 'src/modules/h2h/entity/h2h.entity';
import {
  PlayerStatAtp,
  PlayerStatWta,
} from 'src/modules/player-stats/entity/player-stat.entity';

@Injectable()
export class DatabaseCalculationService {
  constructor(
    @InjectRepository(H2hAtp)
    private h2hAtpRepository: Repository<H2hAtp>,
    @InjectRepository(H2hWta)
    private h2hWtaRepository: Repository<H2hWta>,
    @InjectRepository(PlayerStatAtp)
    private playerStatAtpRepository: Repository<PlayerStatAtp>,
    @InjectRepository(PlayerStatWta)
    private playerStatWtaRepository: Repository<PlayerStatWta>,
    private connection: Connection,
  ) { }

  private selectGames(
    type: 'atp' | 'wta',
  ): Promise<GameAtp[] | GameWta[] | any> {
    return this.connection.query(`
      SELECT ra1.position "positionPlayer1", ra2.position "positionPlayer2", g.id, g."player1Id", g."player2Id", t."courtId", g."roundId", p2."currentRank", p1."currentRank", t."rankId", t."name", t."date", t."tier", g."result" from game_${type} g
      INNER JOIN tournament_${type} t on t.id=g."tournamentId"
      INNER JOIN player_${type} p1 on p1."id"=g."player1Id"
      INNER JOIN player_${type} p2 on p2."id"=g."player2Id"
      LEFT JOIN rating_${type} ra1 on (p1.id = ra1."playerId" and
                                   (t.date is not null and ra1.date between t.date - INTERVAL '3 DAYS' and t.date + INTERVAL '3 DAYS'
--                                            or g.date is not null and ra1.date between g.date - INTERVAL '3 DAYS' and g.date + INTERVAL '3 DAYS'))
                                       ))
      LEFT JOIN rating_${type} ra2 on (p2.id = ra2."playerId" and
                                   (t.date is not null and ra2.date between t.date - INTERVAL '3 DAYS' and t.date + INTERVAL '3 DAYS'
--                                            or g.date is not null and ra2.date between g.date - INTERVAL '3 DAYS' and g.date + INTERVAL '3 DAYS'))
                                       )) 
WHERE g.result is not null 
AND g.date is not null 
AND g.result != '' 
AND g.result != 'bye' 
order by g.id
`);
}
/**
AND g."roundId" != 0 
AND g."roundId" != 1 
AND g."roundId" != 2 
AND g."roundId" != 3 
AND g.result != 'w/o' 
AND t."rankId" != 0
AND t."rankId" != 1 
AND t."rankId" != 6 
 */
  public async calculate(type: 'atp' | 'wta') {
    let h2hRepository = this.h2hAtpRepository;
    let playerStatRepository = this.playerStatAtpRepository;

    if (type == 'wta') {
      h2hRepository = this.h2hWtaRepository;
      playerStatRepository = this.playerStatWtaRepository;
    }

    const games = await this.selectGames(type);
    const h2hs = {};
    const stats = {};

    let count = 0;
    for (const game of games) {
      const courtCondition = [0,1,2,3].indexOf(game.roundId) == -1 && [0,1,6].indexOf(game.rankId) == -1 && game.result != 'w/o';
      const key = `${game.player1Id}.${game.player2Id}`;

      if(courtCondition){
        h2hs[key] = {
          p1: game.player1Id,
          p2: game.player2Id,
          count: ((h2hs[key] || {})['count'] || 0) + 1,
        };
      }

      const year = game?.date.getFullYear();

      let oldData = (stats[game.player1Id] || {})[year] || {};
      let courts = oldData['court'] || {'0': 0};
      let rounds = oldData['round'] || {};
      let rank = oldData['rank'] || {};
      let level = oldData['level'] || {};
      let levelFinals = oldData['levelFinals'] || {};


      const courtWins = { ...courts };
      if(courtCondition){
        courtWins[game.courtId] = {
          ...(courts[game.courtId] || {}),
          w: ((courts[game.courtId] || {})['w'] || 0) + 1,
        };
      }
      const roundWins = { ...rounds };
      roundWins[game.roundId] = {
        ...(rounds[game.roundId] ?? {}),
        w: ((rounds[game.roundId] ?? {})['w'] || 0) + 1,
      };
      const levelWins = this.getLevel(
        level,
        'w',
        game.roundId,
        game.rankId,
      );
      const levelFinalWins = this.getLevelFinals(
        levelFinals,
        'w',
        game.roundId,
        game.rankId,
      );
      const rankWins = this.getRank(rank, 'w', game.positionPlayer2 || 101);

      oldData = (stats[game.player2Id] || {})[year] || {};
      courts = oldData['court'] || {'0': 0};
      rounds = oldData['round'] || {};
      rank = oldData['rank'] || {};
      level = oldData['level'] || {};
      levelFinals = oldData['levelFinals'] || {};

      const courtLoses = { ...courts };
      if(courtCondition){
        courtLoses[game.courtId] = {
          ...(courts[game.courtId] || {}),
          l: ((courts[game.courtId] || {})['l'] || 0) + 1,
        }
      };
      const roundLoses = { ...rounds };
      roundLoses[game.roundId] = {
        ...(rounds[game.roundId] ?? {}),
        l: ((rounds[game.roundId] ?? {})['l'] || 0) + 1,
      };
      const levelLoses = this.getLevel(
        level,
        'l',
        game.roundId,
        game.rankId,
      );
      const levelFinalLoses = this.getLevelFinals(
        levelFinals,
        'l',
        game.roundId,
        game.rankId,
      );
      const rankLoses = this.getRank(rank, 'l', game.positionPlayer1 || 101);

      if (!Object.keys(stats[game.player1Id] ?? {})?.length)
        stats[game.player1Id] = {};
      if (game.player1Id == 1) {
        count++;
      }
      stats[game.player1Id][year] = {
        ...oldData,
        court: courtWins,
        round: roundWins,
        rank: rankWins,
        level: levelWins,
        levelFinals: levelFinalWins,
      };

      if (!Object.keys(stats[game.player2Id] ?? {})?.length)
        stats[game.player2Id] = {};
      stats[game.player2Id][year] = {
        ...oldData,
        court: courtLoses,
        round: roundLoses,
        rank: rankLoses,
        level: levelLoses,
        levelFinals: levelFinalLoses,
      };
    }
    await h2hRepository.count().then((val) => {
      if (val == 0) {
        this.connection.manager.query(`
          alter sequence h2h_${type}_id_seq restart;    
          truncate table public.h2h_${type};
        `)
      }
    })

    const h2hToCreate = {};
    const statsToCreate: PlayerStatAtp[] | PlayerStatWta[] = [];

    for (const h2hKeyWinner of Object.keys(h2hs)) {
      const [id1, id2] = h2hKeyWinner.split('.');
      const h2hKeyLoser = `${id2}.${id1}`;
      const valueWinner = h2hs[h2hKeyWinner];
      const valueLoser = h2hs[h2hKeyLoser] ?? { count: 0 };

      if (!h2hToCreate[h2hKeyLoser]) {
        h2hToCreate[h2hKeyWinner] = h2hRepository.create({
          player1Id: valueWinner.p1,
          player2Id: valueWinner.p2,
          player1Wins: valueWinner.count ?? 0,
          player2Wins: valueLoser.count ?? 0,
        });
        h2hToCreate[h2hKeyLoser] = h2hRepository.create({
          player1Id: valueWinner.p2,
          player2Id: valueWinner.p1,
          player1Wins: valueLoser.count ?? 0,
          player2Wins: valueWinner.count ?? 0,
        });
      }
    }

    for (const keyStat of Object.keys(stats)) {
      statsToCreate.push(
        playerStatRepository.create({
          playerId: parseInt(keyStat),
          data: JSON.stringify(stats[keyStat]),
        }),
      );
    }

    const fragmentSize = 5000;

    const h2hFragments = [];
    const h2hToCreateValues = Object.values(h2hToCreate);
    for (let i = 0; i * fragmentSize < h2hToCreateValues.length; i++) {
      h2hFragments.push(
        h2hToCreateValues.slice(
          i * fragmentSize,
          i * fragmentSize + fragmentSize,
        ),
      );
    }
    for (const h2h of h2hFragments) {
      const updateValues = h2h
        .map(
          (item) =>
            `(${[
              item.player1Id,
              item.player2Id,
              item.player1Wins,
              item.player2Wins,
            ].join(',')})`,
        )
        .join(',');
      await this.connection.query(`
        insert into public.h2h_${type} ("player1Id", "player2Id", "player1Wins", "player2Wins")
        values ${updateValues}
        on conflict ("player1Id", "player2Id")
        do update set "player1Wins"=excluded."player1Wins", "player2Wins"=excluded."player2Wins"
      `);
    }

    await playerStatRepository.count().then((val) => {
      if (val == 0) {
        this.connection.manager.query(`
        alter sequence player_stat_${type}_id_seq restart;
        truncate table public.player_stat_${type};
        `)
      }
    })
    const statsFragments = [];
    for (let i = 0; i * fragmentSize < statsToCreate.length; i++) {
      statsFragments.push(
        statsToCreate.slice(i * fragmentSize, i * fragmentSize + fragmentSize),
      );
    }
    for (const stats of statsFragments) {
      const updateValues = stats
        .map(
          (item) =>
            `(${["'" + JSON.stringify(item.data) + "'", item.playerId].join(
              ',',
            )})`,
        )
        .join(',');
      await this.connection.query(`
        insert into public.player_stat_${type} ("data", "playerId") values ${updateValues}
        on conflict ("playerId")
        do update set data=excluded.data
      `);
    }
  }

  private getRank(rank: any, type: string, playerRank: number) {
    const top1 = {
      ...(rank['top1'] || {}),
    };
    top1[type] = playerRank <= 1 ? (top1[type] || 0) + 1 : top1[type] || 0;

    const top5 = {
      ...(rank['top5'] || {}),
    };
    top5[type] = playerRank <= 5 ? (top5[type] || 0) + 1 : top5[type] || 0;

    const top10 = {
      ...(rank['top10'] || {}),
    };
    top10[type] = playerRank <= 10 ? (top10[type] || 0) + 1 : top10[type] || 0;

    const top20 = {
      ...(rank['top20'] || {}),
    };
    top20[type] = playerRank <= 20 ? (top20[type] || 0) + 1 : top20[type] || 0;

    const top50 = {
      ...(rank['top50'] || {}),
    };
    top50[type] = playerRank <= 50 ? (top50[type] || 0) + 1 : top50[type] || 0;

    const top100 = {
      ...(rank['top100'] || {}),
    };
    top100[type] =
      playerRank <= 100 ? (top100[type] || 0) + 1 : top100[type] || 0;

    return { top1, top5, top10, top20, top50, top100 };
  }

  private getLevel(
    level: any,
    type: string,
    round: number,
    rank: number,
  ) {
    const getCount = (level: any, key: string, type: string) =>
      (level[key] || {})[type] || 0;

    const mastersCount = getCount(level, 'masters', type);
    const tourFinalsCount = getCount(level, 'tourFinals', type);
    const mainTourCount = getCount(level, 'mainTour', type);
    const grandSlamCount = getCount(level, 'grandSlam', type);
    const futuresCount = getCount(level, 'futures', type);
    const challengersCount = getCount(level, 'challengers', type);
    const cupsCount = getCount(level, 'cups', type);
    const totalCount = getCount(level, 'total', type);

    const masters = level['masters'] ?? {};
    const tourFinals = level['tourFinals'] ?? {};
    const mainTour = level['mainTour'] ?? {};
    const grandSlam = level['grandSlam'] ?? {};
    const cups = level['cups'] ?? {};
    const futures = level['futures'] ?? {};
    const challengers = level['challengers'] ?? {};
    const total = level['total'] ?? {};

    const resultLevel = {
      masters: {
        ...masters,
      },
      tourFinals: {
        ...tourFinals,
      },
      mainTour: {
        ...mainTour,
      },
      grandSlam: {
        ...grandSlam,
      },
      cups: {
        ...cups,
      },
      futures: {
        ...futures,
      },
      challengers: {
        ...challengers,
      },
      total: {
        ...total,
      },
    };
    
    resultLevel['masters'][type] = [0,1,2,3].indexOf(round) == -1 &&  rank == 3 ? mastersCount + 1 : mastersCount;
    resultLevel['tourFinals'][type] = [0,1,2,3].indexOf(round) == -1 && rank == 7 && round == 12 ? tourFinalsCount + 1 : tourFinalsCount;
    resultLevel['mainTour'][type] = [0,1,2,3].indexOf(round) == -1 && rank == 2 ? mainTourCount + 1 : mainTourCount;
    resultLevel['grandSlam'][type] = [0,1,2,3].indexOf(round) == -1 && rank == 4 ? grandSlamCount + 1 : grandSlamCount;
    resultLevel['cups'][type] = [0,1,2,3].indexOf(round) == -1 && rank == 5 ? cupsCount + 1 : cupsCount;
    resultLevel['futures'][type] = [0,1,2,3].indexOf(round) == -1 && rank == 0 ? futuresCount + 1 : futuresCount;
    resultLevel['challengers'][type] = [0,1,2,3].indexOf(round) == -1 && rank == 1 ? challengersCount + 1 : challengersCount;

    resultLevel['total'][type] = totalCount + 1;

    return resultLevel;
  }

  private getLevelFinals(
    level: any,
    type: string,
    round: number,
    rank: number,
  ) {
    const getCount = (level: any, key: string, type: string) =>
      (level[key] || {})[type] || 0;

    const mastersCount = getCount(level, 'masters', type);
    const tourFinalsCount = getCount(level, 'tourFinals', type);
    const mainTourCount = getCount(level, 'mainTour', type);
    const grandSlamCount = getCount(level, 'grandSlam', type);
    const futuresCount = getCount(level, 'futures', type);
    const challengersCount = getCount(level, 'challengers', type);
    const cupsCount = getCount(level, 'cups', type);
    const totalCount = getCount(level, 'total', type);

    const masters = level['masters'] ?? {};
    const tourFinals = level['tourFinals'] ?? {};
    const mainTour = level['mainTour'] ?? {};
    const grandSlam = level['grandSlam'] ?? {};
    const cups = level['cups'] ?? {};
    const futures = level['futures'] ?? {};
    const challengers = level['challengers'] ?? {};
    const total = level['total'] ?? {};

    const resultLevel = {
      masters: {
        ...masters,
      },
      tourFinals: {
        ...tourFinals,
      },
      mainTour: {
        ...mainTour,
      },
      grandSlam: {
        ...grandSlam,
      },
      cups: {
        ...cups,
      },
      futures: {
        ...futures,
      },
      challengers: {
        ...challengers,
      },
      total: {
        ...total,
      },
    };

    resultLevel['masters'][type] = rank == 3 && round == 12 ? mastersCount + 1 : mastersCount;
    resultLevel['tourFinals'][type] = rank == 7 && round == 12 ? tourFinalsCount + 1 : tourFinalsCount;
    resultLevel['mainTour'][type] = rank == 2 && round == 12 ? mainTourCount + 1 : mainTourCount;
    resultLevel['grandSlam'][type] = rank == 4 && round == 12  ? grandSlamCount + 1 : grandSlamCount;
    resultLevel['cups'][type] = rank == 5 && round == 16 ? cupsCount + 1 : cupsCount;
    resultLevel['futures'][type] = rank == 0 && round == 12 ? futuresCount + 1 : futuresCount;
    resultLevel['challengers'][type] = rank == 1 && round == 12 ? challengersCount + 1 : challengersCount;

    resultLevel['total'][type] = totalCount + 1;

    return resultLevel;
  }
}
