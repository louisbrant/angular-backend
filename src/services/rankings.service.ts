import { Injectable } from '@nestjs/common';
import { Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RatingAtp, RatingWta } from 'src/modules/ratings/entity/rating.entity';
import { Country } from 'src/modules/country/entity/country.entity';
import { PlayerAtp, PlayerWta } from 'src/modules/player/entity/player.entity';
import { SharedService } from 'src/services/shared.service';
import { RankingDto } from 'src/modules/rankings/dto/ranking.dto';
import { Court } from 'src/modules/court/entity/court.entity';

@Injectable()
export class RankingsService {
  constructor(
    @InjectRepository(RatingAtp)
    private ratingAtpRepository: Repository<RatingAtp>,
    @InjectRepository(RatingWta)
    private ratingWtaRepository: Repository<RatingWta>,
    @InjectRepository(PlayerAtp)
    private playerAtpRepository: Repository<PlayerAtp>,
    @InjectRepository(PlayerWta)
    private playerWtaRepository: Repository<PlayerWta>,
    @InjectRepository(Country)
    private countryRepository: Repository<Country>,
    @InjectRepository(Court)
    private courtRepository: Repository<Court>,
    private sharedService: SharedService,
  ) {}

  public rankingTop10(type: string) {
    let ratingRepository:
      | Repository<RatingAtp>
      | Repository<RatingWta>
      | undefined;
    if (type == 'atp') {
      ratingRepository = this.ratingAtpRepository;
    } else if (type == 'wta') {
      ratingRepository = this.ratingWtaRepository;
    } else {
      return { error: 'Type not found!' };
    }

    return ratingRepository
      .createQueryBuilder('rating')
      .leftJoin('rating.player', 'player')
      .addSelect(['player.name', 'player.countryAcr'])
      .orderBy('rating.date', 'DESC')
      .addOrderBy('rating.position')
      .limit(10)
      .getMany();
  }

  public ranking(type: string, queryParams: RankingDto) {
    let ratingRepository:
      | Repository<RatingAtp>
      | Repository<RatingWta>
      | undefined;
    let playerRepository:
      | Repository<PlayerAtp>
      | Repository<PlayerWta>
      | undefined;
    if (type == 'atp') {
      ratingRepository = this.ratingAtpRepository;
      playerRepository = this.playerAtpRepository;
    } else if (type == 'wta') {
      ratingRepository = this.ratingWtaRepository;
      playerRepository = this.playerWtaRepository;
    } else {
      return { error: 'Type not found!' };
    }

    if (
      queryParams.group != 'doubles' &&
      queryParams.group != 'prize' &&
      !queryParams?.date
    ) {
      return { error: 'Needs date in query params!' };
    }

    if (!queryParams?.group) {
      return { error: 'Needs group in query params!' };
    }

    if (queryParams.group == 'singles') {
      return this.singlesRanking(ratingRepository, queryParams);
    }

    if (queryParams.group == 'doubles') {
      return this.doublesRanking(playerRepository, queryParams);
    }

    if (queryParams.group == 'race') {
      return this.raceRanking(ratingRepository, queryParams);
    }

    if (queryParams.group == 'surface') {
      return [];
    }

    if (queryParams.group == 'prize') {
      return this.prizeRanking(playerRepository, type, queryParams);
    }

    return { error: 'Group not found!' };
  }

  public async rankingFilters(type: string) {
    let ratingRepository:
      | Repository<RatingAtp>
      | Repository<RatingWta>
      | undefined;
    if (type == 'atp') {
      ratingRepository = this.ratingAtpRepository;
    } else if (type == 'wta') {
      ratingRepository = this.ratingWtaRepository;
    } else {
      return { error: 'Type not found!' };
    }

    return ratingRepository
      .createQueryBuilder('rating')
      .select('rating.date')
      .distinctOn(['rating.date'])
      .orderBy('rating.date', 'DESC')
      .getMany()
      .then(async (ratings) => ({
        countries: await this.countryRepository.find({
          where: { name: Not('') },
        }),
        surfaces: await this.courtRepository.find(),
        date: ratings.map((rating) => rating.date),
      }));
  }

  private async singlesRanking(
    ratingRepository: Repository<RatingAtp> | Repository<RatingWta>,
    queryParams: RankingDto,
  ) {
    const splitDate = queryParams.date.split('.');
    const formatDate = [...splitDate.reverse()].join('-');

    const currentDate: any = new Date(formatDate);
    const dates = await ratingRepository
      .query(
        `
          select date from rating_atp
          where extract(year from date)=extract(year from now())
             or extract(year from date)=extract(year from now())-1
          group by date
          order by date DESC;
          `,
      )
      .then((date) => date.map((el) => el.date));
    const lastWeek = new Date(dates[1]);
    const lastYear = new Date(dates[51]);

    const pageSize = 100;
    const response = this.getRankingByDate(
      ratingRepository,
      currentDate,
      queryParams,
      pageSize,
      queryParams.page,
    );

    return response.getMany().then(async (rankings) => {
      const rankingPlayers = rankings.map((rank) => rank.player.id);
      const rankingLastYear = await ratingRepository
        .createQueryBuilder('rating')
        .leftJoin('rating.player', 'player')
        .addSelect(['player.name', 'player.countryAcr'])
        .where('rating.date = :lastYear', {
          lastYear,
        })
        .andWhere(`player.id in (${rankingPlayers})`)
        .orderBy('rating.date', 'DESC')
        .addOrderBy('rating.position')
        .getMany();
      const rankingLastWeek = await ratingRepository
        .createQueryBuilder('rating')
        .leftJoin('rating.player', 'player')
        .addSelect(['player.name', 'player.countryAcr'])
        .where('rating.date = :lastWeek', {
          lastWeek,
        })
        .andWhere(`player.id in (${ rankingPlayers })`)
        .orderBy('rating.date', 'DESC')
        .addOrderBy('rating.position')
        .getMany();
      const currentRankings = rankings.filter(
        (ranking) => ranking.date.getTime() == currentDate.getTime(),
      );
      return currentRankings.map((ranking) => ({
        date: ranking.date,
        pts: ranking.point,
        wk:
          (rankingLastWeek.find(
            (weekRanking) => weekRanking.player.name == ranking.player.name,
          )?.position || 900) - ranking.position,
        yr:
          (rankingLastYear.find(
            (weekRanking) => weekRanking.player.name == ranking.player.name,
          )?.position || 900) - ranking.position,
        wkPts:
          ranking.point -
          rankingLastWeek.find(
              (weekRanking) => weekRanking.player.name == ranking.player.name,
            )?.point || 0,
        position: ranking.position,
        player: ranking.player,
      }));
    });
  }

  private getRankingByDate(
    ratingRepository: any,
    date: string,
    queryParams: RankingDto,
    pageSize: number,
    page: number,
  ) {
    let response = ratingRepository
      .createQueryBuilder('rating')
      .leftJoin('rating.player', 'player')
      .addSelect(['player.name', 'player.countryAcr', 'player.id'])
      .where('(rating.date = :date)', { date })
      .orderBy('rating.date', 'DESC')
      .addOrderBy('rating.position')
      .limit(pageSize)
      .offset(pageSize * page);

    if (queryParams?.countryAcr) {
      response = response.andWhere('player.countryAcr = :queryCountry', {
        queryCountry: queryParams.countryAcr,
      });
    }

    return response;
  }

  private doublesRanking(
    playerRepository: Repository<PlayerAtp> | Repository<PlayerWta>,
    queryParams: RankingDto,
  ) {
    let response = playerRepository
      .createQueryBuilder('player')
      .where('player.doublesPosition is not null')
      .orderBy('player.doublesPosition');

    if (queryParams?.countryAcr) {
      response = response.andWhere('player.countryAcr = :queryCountry', {
        queryCountry: queryParams.countryAcr,
      });
    }

    return response.getMany().then((players) =>
      players.map((player) => ({
        pts: player.doublesPoints,
        wk: player.doublesProgress,
        position: player.doublesPosition,
        player: player,
      })),
    );
  }

  private async raceRanking(
    ratingRepository: Repository<RatingAtp> | Repository<RatingWta>,
    queryParams: RankingDto,
  ) {
    const fromYear = new Date(
      new Date().getFullYear().toString(),
    ).toLocaleDateString();

    const yearRatingDates = await ratingRepository.query(
      `select date
       from rating_atp
       where date >= '${fromYear}'::date
       group by date
       order by date`,
    );
    const currentDate =
      yearRatingDates[
        yearRatingDates.length > 1 ? yearRatingDates.length - 1 : 0
      ].date;
    const lastWeekDate =
      yearRatingDates[
        yearRatingDates.length > 1
          ? yearRatingDates.length - 2
          : yearRatingDates.length
      ].date;
    const firstYearDate = yearRatingDates[0].date;

    const response = ratingRepository
      .createQueryBuilder('rating')
      .leftJoin('rating.player', 'player')
      .addSelect(['player.name', 'player.countryAcr'])
      .where(
        `(rating.date = :firstYearDate or rating.date = :currentDate or rating.date = :lastWeekDate)`,
        {
          currentDate,
          firstYearDate,
          lastWeekDate,
        },
      )
      .orderBy('rating.date', 'DESC')
      .addOrderBy('rating.position');

    return response.getMany().then((rankings) => {
      const currentRankings = rankings.filter(
        (ranking) => ranking.date.getTime() == currentDate.getTime(),
      );
      const lastWeekRankings = rankings.filter(
        (ranking) => ranking.date.getTime() == lastWeekDate.getTime(),
      );
      const firstYearWeekRankings = rankings.filter(
        (ranking) => ranking.date.getTime() == firstYearDate.getTime(),
      );
      const response = currentRankings
        .map((ranking) => ({
          date: ranking.date,
          pts:
            ranking.point -
              firstYearWeekRankings.find(
                (yearRanking) => yearRanking.player.name == ranking.player.name,
              )?.point || 0,
          wkPts:
            ranking.point -
              lastWeekRankings.find(
                (weekRanking) => weekRanking.player.name == ranking.player.name,
              )?.point || 0,
          position: ranking.position,
          player: ranking.player,
        }))
        .sort((a, b) => b.pts - a.pts)
        .map((ranking, index) => ({
          ...ranking,
          position: index + 1,
        }));

      if (!queryParams.countryAcr) return response;

      return response.filter(
        (ranking) => ranking.player.countryAcr == queryParams.countryAcr,
      );
    });
  }

  private prizeRanking(
    playerRepository: Repository<PlayerAtp> | Repository<PlayerWta>,
    type: 'atp' | 'wta',
    queryParams: RankingDto,
  ) {
    // TODO: проверить логику для неполных турниров
    // TODO: проверить наличие даблов
    // TODO: доллары и евро ???
    const limit = 100;
    const offset = parseInt((queryParams?.page ?? 0).toString()) * limit;
    return playerRepository
      .createQueryBuilder('player')
      .select(['player.name', 'player.id', 'player.countryAcr', 'player.prize'])
      .where('player.prize is not null')
      .andWhere("player.name not like '%/%'")
      .orderBy('player.prize', 'DESC')
      .limit(limit)
      .offset(offset)
      .getMany()
      .then((players) =>
        players.map((player, index) => ({
          player,
          prize: player.prize,
          position: index + 1 + (queryParams?.page ?? 0) * 100,
        })),
      );
    // OLD PRIZE
    // .then((players) => {
    //   const prizes = [];
    //   for (const player of players) {
    //     const playerTournamentIds = new Set();
    //     for (const game of player.games) {
    //       playerTournamentIds.add(game.tournament.id);
    //     }
    //     const playerTournamentsById: { [key: string]: any } = {};
    //     const gamesByTournamentId: { [key: string]: any[] } = {};
    //     const bestRoundByTournamentId: { [key: string]: any } = {};
    //     const moneyByTournamentId: { [key: string]: any } = {};
    //     for (const tournamentId of playerTournamentIds) {
    //       if (!gamesByTournamentId[tournamentId.toString()]) {
    //         gamesByTournamentId[tournamentId.toString()] = [];
    //       }
    //       for (const game of player.games) {
    //         if (
    //           !playerTournamentsById[tournamentId.toString()] &&
    //           game.tournament.id == tournamentId
    //         ) {
    //           playerTournamentsById[tournamentId.toString()] =
    //             game.tournament;
    //         }
    //         if (game.tournament.id == tournamentId) {
    //           gamesByTournamentId[tournamentId.toString()].push(game);
    //         }
    //       }
    //
    //       for (const game of gamesByTournamentId[tournamentId.toString()]) {
    //         if (game.player1Id == player.id) {
    //           const bestRound =
    //             bestRoundByTournamentId[tournamentId.toString()] || 0;
    //           bestRoundByTournamentId[tournamentId.toString()] =
    //             game.roundId > bestRound ? game.roundId : bestRound;
    //         }
    //       }
    //       moneyByTournamentId[tournamentId.toString()] =
    //         playerTournamentsById[tournamentId.toString()].singlesPrize[
    //           this.roundIdToName(
    //             bestRoundByTournamentId[tournamentId.toString()],
    //           )
    //         ];
    //     }
    //
    //     let playerSum = 0;
    //     for (const moneyKey of Object.keys(moneyByTournamentId)) {
    //       if (moneyByTournamentId[moneyKey])
    //         playerSum +=
    //           moneyByTournamentId[moneyKey] > 0
    //             ? moneyByTournamentId[moneyKey]
    //             : 0;
    //     }
    //
    //     prizes.push({
    //       player: {
    //         ...player,
    //         image: this.sharedService.getPlayerImage(type, player.id),
    //         games: undefined,
    //       },
    //       prize: playerSum,
    //     });
    //   }
    //
    //   return prizes.sort((a: any, b: any) => b.prize - a.prize).slice(0, 900);
    // });
  }

  private roundIdToName(roundId: number) {
    switch (roundId) {
      case -1:
        return 'preQualifying';
      case 0:
        return 'qualifyingFirst';
      case 1:
        return 'qualifyingSecond';
      case 2:
        return 'qualifying';
      case 3:
        return 'first';
      case 4:
        return 'second';
      case 5:
        return 'third';
      case 6:
        return 'fourth';
      case 7:
        return 'quarterFinalist';
      case 9:
        return 'semiFinalist';
      case 10:
        return 'finalist';
      case 12:
        return 'winner';
    }
    return 0;
  }
}
