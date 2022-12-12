import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Connection, Repository} from 'typeorm';

import {MatchPlayedGameDto} from 'src/modules/game/dto/match-played-game.dto';
import {GameAtp, GameWta} from 'src/modules/game/entity/game.entity';
import {CreateH2hDto} from 'src/modules/h2h/dto/create-h2h.dto';
import {UpdateH2hDto} from 'src/modules/h2h/dto/update-h2h.dto';
import {TourType} from 'src/modules/shared/middlewares/tour.middleware';
import {
    swapObjectValues,
    fixNull,
    divideNumbers,
    countPercentage,
} from 'src/modules/shared/utils/utils';
import {StatAtp, StatWta} from 'src/modules/stat/entity/stat.entity';
import {TodayAtp, TodayWta} from 'src/modules/today/entity/today.entity';
import {PlayerAtp, PlayerWta} from 'src/modules/player/entity/player.entity';
import {SharedService} from './shared.service';
import {
    PlayerStatAtp,
    PlayerStatWta,
} from 'src/modules/player-stats/entity/player-stat.entity';
import {Court} from 'src/modules/court/entity/court.entity';
import {GameService} from './game.service';
import {RatingAtp, RatingWta} from 'src/modules/ratings/entity/rating.entity';
import {Round} from 'src/modules/round/entity/round.entity';
import {Rank} from 'src/modules/rank/entity/rank.entity';
import {
    TournamentAtp,
    TournamentWta,
} from 'src/modules/tournament/entity/tournament.entity';

@Injectable()
export class H2hService {
    constructor(
        @InjectRepository(TodayAtp) private todayAtpRepo: Repository<TodayAtp>,
        @InjectRepository(TodayWta) private todayWtaRepo: Repository<TodayWta>,
        @InjectRepository(GameAtp) private gameAtpRepo: Repository<GameAtp>,
        @InjectRepository(GameWta) private gameWtaRepo: Repository<GameWta>,
        @InjectRepository(PlayerAtp) private playerAtpRepo: Repository<PlayerAtp>,
        @InjectRepository(PlayerWta) private playerWtaRepo: Repository<PlayerWta>,
        @InjectRepository(StatAtp) private statAtpRepo: Repository<StatAtp>,
        @InjectRepository(StatWta) private statWtaRepo: Repository<StatWta>,
        @InjectRepository(PlayerStatAtp) private playerStatAtpRepo: Repository<PlayerStatAtp>,
        @InjectRepository(PlayerStatWta) private playerStatWtaRepo: Repository<PlayerStatWta>,
        @InjectRepository(TournamentAtp) private tournamentAtpRepository: Repository<TournamentAtp>,
        @InjectRepository(TournamentWta) private tournamentWtaRepository: Repository<TournamentWta>,
        @InjectRepository(Court) private courtRepository: Repository<Court>,
        @InjectRepository(Round) private roundRepository: Repository<Round>,
        @InjectRepository(Rank) private rankRepository: Repository<Rank>,
        @InjectRepository(RatingAtp) private ratingAtpRepo: Repository<RatingAtp>,
        @InjectRepository(RatingWta) private ratingWtaRepo: Repository<RatingWta>,
        private connection: Connection,
        private sharedService: SharedService,
        private gameService: GameService,
    ) {
    }

    public async findProfile(type: string, playerOne: string, playerTwo: string, limit: boolean) {
        const playerRepo: Repository<PlayerAtp | PlayerWta> =
            type === TourType.ATP ? this.playerAtpRepo : this.playerWtaRepo;
        const gameRepo: Repository<GameAtp | GameWta> =
            type === TourType.ATP ? this.gameAtpRepo : this.gameWtaRepo;
        const playerStatRepo: Repository<PlayerStatAtp | PlayerStatWta> =
            type === TourType.ATP ? this.playerStatAtpRepo : this.playerStatWtaRepo;
        const ratingRepo: Repository<RatingAtp | RatingWta> =
            type === TourType.ATP ? this.ratingAtpRepo : this.ratingWtaRepo;

        const player1 = await this.getPlayerByName(playerOne, playerRepo);
        const player1Id = player1.id;

        const player2 = await this.getPlayerByName(playerTwo, playerRepo);
        const player2Id = player2.id;


        const recentGames1 = await this.recentGame(player1Id, gameRepo)
            .getMany()
            .then((games) =>
                games
                    .map((game) => (game.player1.id == player1Id ? 'w' : 'l'))
                    .reverse(),
            );


        const playerStat1 = await this.getPlayerStat(player1Id, playerStatRepo);


        const recentGames2 = await this.recentGame(player2Id, gameRepo)
            .getMany()
            .then((games) =>
                games
                    .map((game) => (game.player1.id == player2Id ? 'w' : 'l'))
                    .reverse(),
            );

        const playerStat2 = await this.getPlayerStat(player2Id, playerStatRepo);
        const bestRank1 = await this.bestRank(player1Id, ratingRepo);
        const bestRank2 = await this.bestRank(player2Id, ratingRepo);
        const currentRank1 = await this.currentRank(player1Id, ratingRepo);
        const currentRank2 = await this.currentRank(player2Id, ratingRepo);
        const ytdWL1 = await this.getYTDWL(player1Id, gameRepo);
        const ytdWL2 = await this.getYTDWL(player2Id, gameRepo);
        const ytdTitles1 = await this.getYtdTitles(player1Id, gameRepo);
        const ytdTitles2 = await this.getYtdTitles(player2Id, gameRepo);
        const careerWL1 = await this.getCareerWL(player1Id, gameRepo);
        const careerWL2 = await this.getCareerWL(player2Id, gameRepo);
        const careerMoney1 = await this.careerMoney(player1Id, gameRepo, type);
        const careerMoney2 = await this.careerMoney(player2Id, gameRepo, type);
        const surfaceData = await this.getSurfaceDataForTwo(
            player1Id,
            player2Id,
            gameRepo,
        );
        return {
            player1: {

                id: player1.id,
                name: player1.name,
                country: player1.country.name,
                contryAcr: player1.country.acronym,
                playerStat: playerStat1,
                image: this.sharedService.getPlayerImage(type, player1.id),
                birthday: player1.birthday,
                currentRank: currentRank1,
                plays: player1.information[0]?.plays?.split(',')[0],
                recentGames: recentGames1,
                bestRank: bestRank1,
                ...ytdWL1,
                ytdWLPercentage: countPercentage(
                    ytdWL1.ytdWon,
                    ytdWL1.ytdWon + ytdWL1.ytdLost,
                ),
                ytdTitles: ytdTitles1,
                ...careerWL1,
                careerWLPercentage: countPercentage(
                    careerWL1.careerWin,
                    careerWL1.careerWin + careerWL1.careerLose,
                ),
                careerMoney: careerMoney1,
                totalTitles: await this.getYtdTitles(player1Id, gameRepo, true)
            },
            player2: {
                id: player2.id,
                name: player2.name,
                country: player2.country.name,
                contryAcr: player2.country.acronym,
                playerStat: playerStat2,
                image: this.sharedService.getPlayerImage(type, player2.id),
                birthday: player2.birthday,
                currentRank: currentRank2,
                plays: player2.information[0]?.plays?.split(',')[0],
                recentGames: recentGames2,
                bestRank: bestRank2,
                ...ytdWL2,
                ytdWLPercentage: countPercentage(
                    ytdWL2.ytdWon,
                    ytdWL2.ytdWon + ytdWL2.ytdLost,
                ),
                ytdTitles: ytdTitles2,
                ...careerWL2,
                careerWLPercentage: countPercentage(
                    careerWL2.careerWin,
                    careerWL2.careerWin + careerWL2.careerLose,
                ),
                careerMoney: careerMoney2,
                totalTitles: await this.getYtdTitles(player2Id, gameRepo, true)
            },
            surfaceData,
        };
    }

    public async pvpH2hStats(
        type: string,
        playerOne: string,
        playerTwo: string,
        query: MatchPlayedGameDto,
    ) {
        const playerRepo: Repository<PlayerAtp | PlayerWta> =
            type === TourType.ATP ? this.playerAtpRepo : this.playerWtaRepo;
        const statRepo: Repository<StatAtp | StatWta> =
            type === TourType.ATP ? this.statAtpRepo : this.statWtaRepo;
        const h2hTourType = type === TourType.ATP ? 'H2hAtp' : 'H2hWta';
        const gameRepo: Repository<GameAtp | GameWta> =
            type === TourType.ATP ? this.gameAtpRepo : this.gameWtaRepo;
        const game = type === TourType.ATP ? GameAtp : GameWta;

        const player1 = await this.getPlayerByName(playerOne, playerRepo);
        const player1Id = player1.id;
        const name1 = player1.name;
        const player2 = await this.getPlayerByName(playerTwo, playerRepo);
        const name2 = player2.name;
        const player2Id = player2.id;
        const surfaceData = await this.getSurfaceDataForTwo(
            player1Id,
            player2Id,
            gameRepo,
        );
        const courts = query.court?.split(',')?.map((name) => `'${(name || '').toString().toLowerCase()}'`).join(" ,")

        let response = await statRepo
            .createQueryBuilder('stat')
            .leftJoin('stat.player1', 'winner')
            .leftJoin('stat.player2', 'loser')
            .addSelect(['winner.id', 'winner.name', 'loser.id', 'loser.name'])
            .leftJoinAndSelect('stat.tournament', 'tour')
            .leftJoinAndSelect('tour.court', 'court')
            .leftJoinAndSelect('tour.rank', 'rank')
            .leftJoinAndMapOne(
                'stat.game',
                game,
                'game',
                '(game.player1 = stat.player1 and game.player2 = stat.player2) and game.tournament = tour.id and stat.round = game.roundId',
            )
            .where(
                `(winner.id = ${player1Id} and loser.id = ${player2Id}) or (winner.id = ${player2Id} and loser.id = ${player1Id})`,
            )
            .andWhere('game.roundId != 0')
            .andWhere('game.roundId != 1')
            .andWhere('game.roundId != 2')
            .andWhere('game.roundId != 3')
            .andWhere('game.result is not null')
            .andWhere('game.date is not null')
            .andWhere("game.result != 'w/o'")
            .andWhere("game.result != 'bye'")
            .andWhere("game.result != ''")
            .andWhere("game.result not like '%ret%'")
            .orderBy('tour.date', 'DESC');
        if (query?.level) {
            if (query.level == 3) {
                response = response.andWhere(
                    `rank.id = '${query.level}' and tour.name not like '%ATP Finals%'`
                );
            } else {
                response = response.andWhere(`rank.id = '${query.level}'`);
            }
        }
        let round;
        if (query?.round) {
             round = await this.roundRepository.findOne({
                where: {
                    name: query.round
                }
            });

            response = response
                .leftJoinAndSelect('game.round', 'round')
                .andWhere(`LOWER(round.name) = LOWER('${query.round}')`);
        }

        const queries = `SELECT * from (SELECT * FROM (${response.getQuery()}) stats) s 
             ${query?.court ? `where LOWER(court_name) IN (${courts})` : ''}
             ${query?.tournament ? `${query?.court ? 'and' : 'where'} tour_name = '${query.tournament}'` : ''} 
             ${query?.level ? ` ${query?.tournament || query?.court ? 'and' : 'where'} rank_id = '${query.level}'` : ''}
             ${query?.round ? `${query?.tournament || query?.court || query?.level ? 'and' : 'where'}  stat_round = '${round.id}'` : ''}`;

        return await this.connection.query(queries).then(async (stats: any) => {
            if (stats.length === 0) {
                throw new NotFoundException('No stats');
            }
            if (stats.some((stat) => stat.game === null)) {
                throw new NotFoundException('No games');
            }
            const result = {
                gamesServed: 0,
                gamesWon1: 0,
                gamesWon2: 0,
                setsWon1: 0,
                setsWon2: 0,
                avgTime1: 0,
                avgTime2: 0,
                hard1: 0,
                hard2: 0,
                iHard1: 0,
                iHard2: 0,
                clay1: 0,
                clay2: 0,
                grass1: 0,
                grass2: 0,
                totalAces1: 0,
                totalAces2: 0,
                totalDF1: 0,
                totalDF2: 0,
                doubleFaults1: 0,
                doubleFaults2: 0,
                firstServe1: 0,
                firstServe2: 0,
                firstServeOf1: 0,
                firstServeOf2: 0,
                winningOnFirstServe1: 0,
                winningOnFirstServe2: 0,
                winningOnFirstServeOf1: 0,
                winningOnFirstServeOf2: 0,
                winningOnSecondServe1: 0,
                winningOnSecondServe2: 0,
                winningOnSecondServeOf1: 0,
                winningOnSecondServeOf2: 0,
                breakPointsConverted1: 0,
                breakPointsConvertedOf1: 0,
                breakPointsConverted2: 0,
                breakPointsConvertedOf2: 0,
                totalPointsWon1: 0,
                totalPointsWon2: 0,
                firstServePercentage1: 0,
                firstServePercentage2: 0,
                winningOnFirstServePercentage1: 0,
                winningOnFirstServePercentage2: 0,
                winningOnSecondServePercentage1: 0,
                winningOnSecondServePercentage2: 0,
                slam1: 0,
                slam2: 0,
                master1: 0,
                master2: 0,
                main1: 0,
                main2: 0,
                tourFinals1: 0,
                tourFinals2: 0,
                title1: 0,
                title2: 0,
                cup1: 0,
                cup2: 0,
                future1: 0,
                future2: 0,
                challengers1: 0,
                challengers2: 0,
                doubleFaultsCount1: 0,
                doubleFaultsCount2: 0,
                acesCount1: 0,
                acesCount2: 0,
                returnPtsWin1: 0,
                returnPtsWin2: 0,
                returnPtsWinOf1: 0,
                returnPtsWinOf2: 0,
                returnPtsWinPercentage1: 0,
                returnPtsWinPercentage2: 0,
                breakpointsWonPercentage1: 0,
                breakpointsWonPercentage2: 0,
                bestOfThreeWon1: 0,
                bestOfThreeWonPercentage1: 0,
                bestOfThreeWon2: 0,
                bestOfThreeWonPercentage2: 0,
                bestOfFiveWon1: 0,
                bestOfFiveWonPercentage1: 0,
                bestOfFiveWon2: 0,
                bestOfFiveWonPercentage2: 0,
                bestOfThreeCount: 0,
                bestOfFiveCount: 0,
                decidingSetWin1: 0,
                decidingSetWin2: 0,
                tiebreakWon1: 0,
                tiebreakWon2: 0,
                matchesWon1: 0,
                matchesWon2: 0,
                firstSetWinMatchWin1: 0,
                firstSetWinMatchWin2: 0,
                firstSetWinMatchLose1: 0,
                firstSetWinMatchLose2: 0,
                firstSetLoseMatchWin1: 0,
                firstSetLoseMatchWin2: 0,
                firstSetWinMatchWinPercentage1: 0,
                firstSetWinMatchWinPercentage2: 0,
                firstSetWinMatchLosePercentage1: 0,
                firstSetWinMatchLosePercentage2: 0,
                firstSetLoseMatchWinPercentage1: 0,
                firstSetLoseMatchWinPercentage2: 0,
                decidingSetWinPercentage1: 0,
                decidingSetWinPercentage2: 0,
                totalTBWinPercentage1: 0,
                totalTBWinPercentage2: 0,
                firstSetWinCount: 0,
                firstSetLoseCount: 0,
                matchesCount: await response.getCount(),
            };

            // По дефолту победитель всегда игрок 1, но это не всегда игрок 1 и тот же игрок
            // Раставляем статы первого игрока на 1 и второго на 2
            stats
                .map((stat: any) => {
                    return {
                        ...swapObjectValues(
                            {
                                returnPtsWin1: stat.stat_rpw1,
                                returnPtsWin2: stat.stat_rpw2
                            },
                            stat.stat_player1Id === player1Id,
                        ),
                        ...swapObjectValues(
                            {
                                returnPtsWinOf1: stat.stat_rpwOf1,
                                returnPtsWinOf2: stat.stat_rpwOf2
                            },
                            stat.stat_player1Id === player1Id,
                        ),
                        ...swapObjectValues(
                            {
                                aces1: stat.stat_aces1,
                                aces2: stat.stat_aces2
                            },
                            stat.stat_player1Id === player1Id,
                        ),
                        ...swapObjectValues(
                            {
                                doubleFaults1: stat.stat_doubleFaults1,
                                doubleFaults2: stat.stat_doubleFaults2,
                            },
                            stat.stat_player1Id === player1Id,
                        ),
                        ...swapObjectValues(
                            {
                                firstServe1: stat.stat_firstServe1,
                                firstServe2: stat.stat_firstServe2
                            },
                            stat.stat_player1Id === player1Id,
                        ),
                        ...swapObjectValues(
                            {
                                firstServeOf1: stat.stat_firstServeOf1,
                                firstServeOf2: stat.stat_firstServeOf2,
                            },
                            stat.stat_player1Id === player1Id,
                        ),
                        ...swapObjectValues(
                            {
                                winningOnFirstServe1: stat.stat_winningOnFirstServe1,
                                winningOnFirstServe2: stat.stat_winningOnFirstServe2,
                            },
                            stat.stat_player1Id === player1Id,
                        ),
                        ...swapObjectValues(
                            {
                                winningOnFirstServeOf1: stat.stat_winningOnFirstServeOf1,
                                winningOnFirstServeOf2: stat.stat_winningOnFirstServeOf2,
                            },
                            stat.stat_player1Id === player1Id,
                        ),
                        ...swapObjectValues(
                            {
                                winningOnSecondServe1: stat.stat_winningOnSecondServe1,
                                winningOnSecondServe2: stat.stat_winningOnSecondServe2,
                            },
                            stat.stat_player1Id === player1Id,
                        ),
                        ...swapObjectValues(
                            {
                                winningOnSecondServeOf1: stat.stat_winningOnSecondServeOf1,
                                winningOnSecondServeOf2: stat.stat_winningOnSecondServeOf2,
                            },
                            stat.stat_player1Id === player1Id,
                        ),
                        ...swapObjectValues(
                            {
                                breakPointsConverted1: stat.stat_breakPointsConverted1,
                                breakPointsConverted2: stat.stat_breakPointsConverted2,
                            },
                            stat.stat_player1Id === player1Id,
                        ),
                        ...this.getAvgMatchTime(stat.stat_mt),
                        ...swapObjectValues(
                            {
                                breakPointsConvertedOf1: stat.stat_breakPointsConvertedOf1,
                                breakPointsConvertedOf2: stat.stat_breakPointsConvertedOf2,
                            },
                            stat.stat_player1Id === player1Id,
                        ),
                        ...swapObjectValues(
                            {
                                totalPointsWon1: stat.stat_totalPointsWon1,
                                totalPointsWon2: stat.stat_totalPointsWon2,
                            },
                            stat.stat_player1Id === player1Id,
                        ),
                        ...this.getAvgMatchTime(stat.stat_mt),
                        ...this.getCourtStat(
                            stat.tournament_court_id,
                            stat.stat_player1Id === player1Id,
                        ),
                        ...this.getTournamentRank(
                            stat.tournament_rank_id,
                            stat.round_id,
                            stat.stat_player1Id === player1Id,
                        ),
                        ...this.getGamesData(
                            stat.game_result,
                            stat.stat_player1Id === player1Id,
                        ),
                        ...this.getDecidingSetStat(
                            stat.game_result,
                            stat.stat_player1Id === player1Id,
                        ),
                        ...this.getSetsWon(
                            stat.game_result,
                            stat.stat_player1Id === player1Id,
                        ),
                        ...this.getTiebreaksWon(
                            stat.game_result,
                            stat.stat_player1Id === player1Id,
                        ),
                        ...this.getBestOfStat(
                            stat.game_result,
                            stat.stat_player1Id === player1Id,
                        ),
                        ...this.getFirstSetWinMatchWin(
                            stat.game_result,
                            stat.stat_player1Id === player1Id,
                        ),
                        ...this.getFirstSetWinMatchLose(
                            stat.game_result,
                            stat.stat_player1Id === player1Id,
                        ),
                        ...this.getFirstSetLoseMatchWin(
                            stat.game_result,
                            stat.stat_player1Id === player1Id,
                        ),
                        ...this.GetFirstSetWinLoseCount(
                            stat.game_result,
                            stat.stat_player1Id === player1Id,
                        ),
                    };
                })
                // складываем значения в один обьект
                .forEach((stat: any) => {
                    result.returnPtsWin1 += fixNull(stat.returnPtsWin1)
                    result.returnPtsWin2 += fixNull(stat.returnPtsWin2)
                    result.returnPtsWinOf1 += fixNull(stat.returnPtsWinOf1)
                    result.returnPtsWinOf2 += fixNull(stat.returnPtsWinOf2)
                    result.totalAces1 += fixNull(stat.aces1);
                    result.totalAces2 += fixNull(stat.aces2);
                    result.doubleFaults1 += fixNull(stat.doubleFaults1);
                    result.doubleFaults2 += fixNull(stat.doubleFaults2);
                    result.firstServe1 += fixNull(stat.firstServe1);
                    result.firstServe2 += fixNull(stat.firstServe2);
                    result.firstServeOf1 += fixNull(stat.firstServeOf1);
                    result.firstServeOf2 += fixNull(stat.firstServeOf2);
                    result.winningOnFirstServe1 += fixNull(stat.winningOnFirstServe1);
                    result.winningOnFirstServe2 += fixNull(stat.winningOnFirstServe2);
                    result.winningOnFirstServeOf1 += fixNull(stat.winningOnFirstServeOf1);
                    result.winningOnFirstServeOf2 += fixNull(stat.winningOnFirstServeOf2);
                    result.winningOnSecondServe1 += fixNull(stat.winningOnSecondServe1);
                    result.winningOnSecondServe2 += fixNull(stat.winningOnSecondServe2);
                    result.winningOnSecondServeOf1 += fixNull(
                        stat.winningOnSecondServeOf1,
                    );
                    result.winningOnSecondServeOf2 += fixNull(
                        stat.winningOnSecondServeOf2,
                    );
                    result.breakPointsConverted1 += fixNull(stat.breakPointsConverted1);
                    result.breakPointsConverted2 += fixNull(stat.breakPointsConverted2);
                    result.breakPointsConvertedOf1 += fixNull(
                        stat.breakPointsConvertedOf1,
                    );
                    result.breakPointsConvertedOf2 += fixNull(
                        stat.breakPointsConvertedOf2,
                    );
                    result.totalPointsWon1 += fixNull(stat.totalPointsWon1);
                    result.totalPointsWon2 += fixNull(stat.totalPointsWon2);

                    result.avgTime1 += stat.avgTime1;
                    result.avgTime2 += stat.avgTime2;
                    result.hard1 += stat.hard1;
                    result.hard2 += stat.hard2;
                    result.clay1 += stat.clay1;
                    result.clay2 += stat.clay2;
                    result.iHard1 += stat.iHard1;
                    result.iHard2 += stat.iHard2;
                    result.grass1 += stat.grass1;
                    result.grass2 += stat.grass2;
                    result.slam1 += stat.slam1;
                    result.slam2 += stat.slam2;
                    result.master1 += stat.master1;
                    result.master2 += stat.master2;
                    result.main1 += stat.main1;
                    result.main2 += stat.main2;
                    result.cup1 += stat.cup1;
                    result.cup2 += stat.cup2;
                    result.future1 += stat.future1;
                    result.future2 += stat.future2;
                    result.challengers1 += stat.challengers1;
                    result.challengers2 += stat.challengers2;
                    result.title1 += stat.title1;
                    result.title2 += stat.title2;

                    result.bestOfThreeWon1 += stat.bestOfThreeWon1;
                    result.bestOfThreeWon2 += stat.bestOfThreeWon2;
                    result.bestOfFiveWon1 += stat.bestOfFiveWon1;
                    result.bestOfFiveWon2 += stat.bestOfFiveWon2;
                    result.bestOfThreeCount += stat.bestOfThreeWon1 + stat.bestOfThreeWon2,
                        result.bestOfFiveCount += stat.bestOfFiveWon1 + stat.bestOfFiveWon2,
                        result.setsWon1 += stat.setsWon1;
                    result.setsWon2 += stat.setsWon2;
                    result.decidingSetWin1 += stat.decidingSetWin1;
                    result.decidingSetWin2 += stat.decidingSetWin2;
                    result.tiebreakWon1 += stat.tiebreakWon1;
                    result.tiebreakWon2 += stat.tiebreakWon2;
                    result.gamesWon1 += stat.gamesWon1;
                    result.gamesWon2 += stat.gamesWon2;
                    result.gamesServed += stat.gamesServed;
                    result.firstSetWinMatchWin1 += stat.firstSetWinMatchWin1;
                    result.firstSetWinMatchWin2 += stat.firstSetWinMatchWin2;
                    result.firstSetWinMatchLose1 += stat.firstSetWinMatchLose1;
                    result.firstSetWinMatchLose2 += stat.firstSetWinMatchLose2;
                    result.firstSetLoseMatchWin1 += stat.firstSetLoseMatchWin1;
                    result.firstSetLoseMatchWin2 += stat.firstSetLoseMatchWin2;
                    result.firstSetWinCount += stat.firstSetWinCount;
                    result.firstSetLoseCount += stat.firstSetLoseCount;
                });

            // расчеты

            const milliseconds1 = new Date(
                result.avgTime1 / result.matchesCount,
            ).getTime();
            const milliseconds2 = new Date(
                result.avgTime2 / result.matchesCount,
            ).getTime();
            const hours1 = Math.floor(milliseconds1 / 1000 / 60 / 60);
            const hours2 = Math.floor(milliseconds2 / 1000 / 60 / 60);
            const minutes1 = Math.floor(milliseconds1 / 1000 / 60) % 60;
            const minutes2 = Math.floor(milliseconds2 / 1000 / 60) % 60;
            const seconds1 = Math.floor(milliseconds1 / 1000) % 60;
            const seconds2 = Math.floor(milliseconds2 / 1000) % 60;

            const time1 = `${hours1}:${minutes1}:${seconds1}`;
            const time2 = `${hours2}:${minutes2}:${seconds2}`;

            const res = {
                matchesCount: result.matchesCount,
                player1: {
                    name: name1,
                    matchesWon: result.bestOfFiveWon1 + result.bestOfThreeWon1,
                    acesCount: result.totalAces1,
                    doubleFaultsCount: result.doubleFaults1,
                    avgTime: time1,
                    firstServe: result.firstServe1,
                    firstServeOf: result.firstServeOf1,
                    firstServePercentage: countPercentage(
                        result.firstServe1,
                        result.firstServeOf1,
                    ),
                    winningOnFirstServe: result.winningOnFirstServe1,
                    winningOnFirstServeOf: result.winningOnFirstServeOf1,
                    winningOnSecondServe: result.winningOnSecondServe1,
                    winningOnSecondServeOf: result.winningOnSecondServeOf1,
                    winningOnFirstServePercentage: countPercentage(
                        result.winningOnFirstServe1,
                        result.winningOnFirstServeOf1,
                    ),
                    winningOnSecondServePercentage: countPercentage(
                        result.winningOnSecondServe1,
                        result.winningOnSecondServeOf1,
                    ),
                    returnPtsWin: result.returnPtsWin1,
                    returnPtsWinOf: result.returnPtsWinOf1,
                    returnPtsWinPercentage: countPercentage(
                        result.returnPtsWin1,
                        result.returnPtsWinOf1,
                    ),
                    breakPointsConverted: result.breakPointsConverted1,
                    breakPointsConvertedOf: result.breakPointsConvertedOf1,
                    breakpointsWonPercentage: countPercentage(
                        result.breakPointsConverted1,
                        result.breakPointsConvertedOf1,
                    ),
                    bestOfThreeWon: result.bestOfThreeWon1,
                    bestOfThreeWonPercentage: countPercentage(
                        result.bestOfThreeWon1,
                        result.bestOfThreeCount,
                    ),
                    bestOfThreeCount: result.bestOfThreeCount,
                    bestOfFiveWon: result.bestOfFiveWon1,
                    bestOfFiveWonPercentage: countPercentage(
                        result.bestOfFiveWon1,
                        result.bestOfFiveCount,
                    ),
                    bestOfFiveCount: result.bestOfFiveCount,
                    firstSetWinMatchWin: result.firstSetWinMatchWin1,
                    firstSetWinMatchWinPercentage: countPercentage(
                        result.firstSetWinMatchWin1,
                        result.firstSetWinCount,
                    ),
                    firstSetWinMatchLose: result.firstSetWinMatchLose1,
                    firstSetWinMatchLosePercentage: countPercentage(
                        result.firstSetWinMatchLose1,
                        result.firstSetWinCount,
                    ),
                    firstSetLoseMatchWin: result.firstSetLoseMatchWin1,
                    firstSetLoseMatchWinPercentage: countPercentage(
                        result.firstSetLoseMatchWin1,
                        result.firstSetLoseCount,
                    ),
                    firstSetWinCount: result.firstSetWinCount,
                    firstSetLoseCount: result.firstSetLoseCount,
                    decidingSetWin: result.decidingSetWin1,
                    decidingSetCount: result.decidingSetWin1 + result.decidingSetWin2,
                    decidingSetWinPercentage: countPercentage(
                        result.decidingSetWin1,
                        result.decidingSetWin1 + result.decidingSetWin2,
                    ),
                    tiebreakWon: result.tiebreakWon1,
                    tiebreakCount: result.tiebreakWon1 + result.tiebreakWon2,
                    totalTBWinPercentage: countPercentage(
                        result.tiebreakWon1,
                        result.tiebreakWon1 + result.tiebreakWon2,
                    ),
                    setsWon: result.setsWon1,
                    gamesWon: result.gamesWon1,
                    title: result.title1,
                    grandSlam: result.slam1,
                    masters: result.master1,
                    mainTour: result.main1,
                    tourFinals: result.tourFinals1,
                    cups: result.cup1,
                    futures: result.future1,
                    challengers: result.challengers1,
                },
                player2: {
                    name: name2,
                    matchesWon: result.bestOfFiveWon2 + result.bestOfThreeWon2,
                    acesCount: result.totalAces2,
                    doubleFaultsCount: result.doubleFaults2,
                    avgTime: time2,
                    firstServe: result.firstServe2,
                    firstServeOf: result.firstServeOf2,
                    firstServePercentage: countPercentage(
                        result.firstServe2,
                        result.firstServeOf2,
                    ),
                    winningOnFirstServe: result.winningOnFirstServe2,
                    winningOnFirstServeOf: result.winningOnFirstServeOf2,
                    winningOnFirstServePercentage: countPercentage(
                        result.winningOnFirstServe2,
                        result.winningOnFirstServeOf2,
                    ),
                    winningOnSecondServe: result.winningOnSecondServe2,
                    winningOnSecondServeOf: result.winningOnSecondServeOf2,
                    winningOnSecondServePercentage: countPercentage(
                        result.winningOnSecondServe2,
                        result.winningOnSecondServeOf2,
                    ),
                    returnPtsWin: result.returnPtsWin2,
                    returnPtsWinOf: result.returnPtsWinOf2,
                    returnPtsWinPercentage: countPercentage(
                        result.returnPtsWin2,
                        result.returnPtsWinOf2,
                    ),
                    breakPointsConverted: result.breakPointsConverted2,
                    breakPointsConvertedOf: result.breakPointsConvertedOf2,
                    breakpointsWonPercentage: countPercentage(
                        result.breakPointsConverted2,
                        result.breakPointsConvertedOf2,
                    ),
                    bestOfThreeWon: result.bestOfThreeWon2,
                    bestOfThreeWonPercentage: countPercentage(
                        result.bestOfThreeWon2,
                        result.bestOfThreeCount,
                    ),
                    bestOfThreeCount: result.bestOfThreeCount,
                    bestOfFiveWon: result.bestOfFiveWon2,
                    bestOfFiveWonPercentage: countPercentage(
                        result.bestOfFiveWon2,
                        result.bestOfFiveCount,
                    ),
                    bestOfFiveCount: result.bestOfFiveCount,
                    firstSetWinMatchWin: result.firstSetWinMatchWin2,
                    firstSetWinMatchWinPercentage: countPercentage(
                        result.firstSetWinMatchWin2,
                        result.firstSetLoseCount,
                    ),
                    firstSetWinMatchLose: result.firstSetWinMatchLose2,
                    firstSetWinMatchLosePercentage: countPercentage(
                        result.firstSetWinMatchLose2,
                        result.firstSetLoseCount,
                    ),
                    firstSetLoseMatchWin: result.firstSetLoseMatchWin2,
                    firstSetLoseMatchWinPercentage: countPercentage(
                        result.firstSetLoseMatchWin2,
                        result.firstSetWinCount,
                    ),
                    firstSetWinCount: result.firstSetLoseCount,
                    firstSetLoseCount: result.firstSetWinCount,
                    decidingSetWin: result.decidingSetWin2,
                    decidingSetCount: result.decidingSetWin1 + result.decidingSetWin2,
                    decidingSetWinPercentage: countPercentage(
                        result.decidingSetWin2,
                        result.decidingSetWin1 + result.decidingSetWin2,
                    ),
                    tiebreakWon: result.tiebreakWon2,
                    tiebreakCount: result.tiebreakWon1 + result.tiebreakWon2,
                    totalTBWinPercentage: countPercentage(
                        result.tiebreakWon2,
                        result.tiebreakWon1 + result.tiebreakWon2,
                    ),
                    setsWon: result.setsWon2,
                    gamesWon: result.gamesWon2,
                    title: result.title2,
                    grandSlam: result.slam2,
                    masters: result.master2,
                    mainTour: result.main2,
                    tourFinals: result.tourFinals2,
                    cups: result.cup2,
                    futures: result.future2,
                    challengers: result.challengers2,
                },
                surfaceData,
            };
            return res;
        });
    }

    public async pvpMatchesPlayed(
        type: string,
        playerOne: string,
        playerTwo: string,
        query: MatchPlayedGameDto,
    ) {
        const gameRepo: Repository<GameAtp | GameWta> =
            type === TourType.ATP ? this.gameAtpRepo : this.gameWtaRepo;
        const statTourType = type === TourType.ATP ? 'StatAtp' : 'StatWta';

        let response = gameRepo
            .createQueryBuilder('game')
            .leftJoinAndSelect('game.player1', 'winner')
            .leftJoinAndSelect('game.player2', 'loser')
            .leftJoinAndSelect('game.tournament', 'tour')
            .leftJoinAndMapOne(
                'game.stats',
                `${statTourType}`,
                'stats',
                '(stats.player1 = game.player1 and stats.player2 = game.player2 OR stats.player1 = game.player2 and stats.player2 = game.player1) and stats.tournament = tour.id',
            )
            .where(
                '(winner.name = :playerOne and loser.name = :playerTwo or loser.name = :playerOne and winner.name = :playerTwo)',
                {
                    playerOne,
                    playerTwo,
                },
            ).andWhere("game.result not like '%ret%'")

        response = response.leftJoinAndSelect('tour.court', 'court');
        if (query?.court) {
            response = response.andWhere('LOWER(court.name) = LOWER(:courtFilter)', {
                courtFilter: query.court,
            });
        }

        if (query?.round) {
            response = response
                .leftJoinAndSelect('game.round', 'round')
                .andWhere('LOWER(round.name) = LOWER(:roundFilter)', {
                    roundFilter: query.round,
                });
        }

        return response
            .orderBy('tour.date', 'DESC')
            .limit(10)
            .offset(10 * ((query?.page || 1) - 1))
            .getMany()
            .then(async (games) => {
                if (games.length === 0) {
                    throw new NotFoundException('No games');
                }
                const gamesMapped = games.map((game: GameAtp | GameWta | any) => ({
                    ...game,
                    id: undefined,
                    stats: undefined,
                    odd1: undefined,
                    odd2: undefined,
                    seed1: undefined,
                    seed2: undefined,
                    ...this.gameService.mapGameStats(type, game),
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

    public async findCurrentEventStats(type: TourType, player: string, player2: string) {
        const todayRepo: Repository<TodayAtp | TodayWta> = type === TourType.ATP ? this.todayAtpRepo : this.todayWtaRepo;
        const tournamentRepo: Repository<TournamentAtp | TournamentWta> = type === TourType.ATP ? this.tournamentAtpRepository : this.tournamentWtaRepository;

        const statTourType = type === TourType.ATP ? 'StatAtp' : 'StatWta';

        let tournaments = await this.connection.query(`
    SELECT "tour"."id", "tour"."name", "p1"."name" as p1name, "p2"."name" as p2name
    FROM "tournament_atp" "tour" 
    INNER JOIN "today_atp" "today" ON "tour"."id" = today."tournamentId"  
    INNER JOIN "player_atp" "p1" ON "p1"."id" = today."player1Id" or "p1"."id" = today."player2Id"  
    INNER JOIN "player_atp" "p2" ON "p2"."id" = today."player1Id" or "p2"."id" = today."player2Id" 
    WHERE "p1"."name" like '%${player}%' AND "p2"."name" like '%${player2}%' 
    GROUP BY "tour"."id", "p1"."id", "p2"."id"`);

        if (tournaments.length == 0) {
            throw new NotFoundException(`No tournament for '${player}' vs '${player2}'`);
        }

        const response = todayRepo
            .createQueryBuilder('today')
            .leftJoin('today.player1', 'player1')
            .leftJoin('today.player2', 'player2')
            .leftJoin('today.tournament', 'tournament')
            .leftJoin('tournament.court', 'court')
            .addSelect([
                'player1.name',
                'player1.currentRank',
                'player2.name',
                'player2.currentRank',
                'tournament.name',
                'tournament.countryAcr',
                'court.name',
            ])
              .leftJoinAndMapOne(
                'today.stat',
                `${statTourType}`,
                'stat',
                "(stat.player1 = today.player1 and stat.player2 = today.player2 OR stat.player1 = today.player2 and stat.player2 = today.player1) and stat.tournament = tournament.id",
            )
            .where('(player1.name = :player or player2.name = :player)', {player})
            .andWhere(`tournament.id = ${tournaments[0].id}`)
            .andWhere('today.result is not null')
            .andWhere('today.date is not null')
            //.andWhere("today.result != 'w/o'")
            //.andWhere("today.result != 'bye'")
            .andWhere("today.result != ''")
            .orderBy('today.date', 'DESC');

        return response.getMany().then((matches: any) => {
            if (matches.length === 0) {
                throw new NotFoundException('No current event data');
            }
            if (matches.some((match) => match.stat === null)) {
                throw new NotFoundException("Some games don't have stats");
            }

            const result = {
                ...matches[0],
                matchesPlayed: matches.length,
                id: matches[0].id,
                averageFirstServeSpeed: 0,
                averageSecondServeSpeed: 0,
                fastestServe: 0,
                gamesWon: 0,
                setsWon: 0,
                firstServe: 0,
                firstServeOf: 0,
                winningOnFirstServe: 0,
                winningOnFirstServe2: 0,
                winningOnFirstServeOf: 0,
                winningOnSecondServe: 0,
                winningOnSecondServe2: 0,
                winningOnSecondServeOf: 0,
                netApproaches1: 0,
                netApproaches1Of: 0,
                breakPointsConverted: 0,
                breakPointsConvertedOf: 0,
                breakPointsConverted2: 0,
                breakPointsConvertedOf2: 0,
                totalPointsWon: 0,
                breakpointsSaved: 0,
                unforcedErrors: 0,
                tiebreakWon: 0,
                matchesWon: 0,
                decidingSetWin: 0,
                firstSetWinMatchWin: 0,
                firstSetLoseMatchWin: 0,
                avgTime: 0,
                winsCountOnWin1: 0,
                winsCountOnWin2: 0,
                avgOpponentRank: 0,
            };

            matches
                .map((match) => {
                    if (!match.stat) {
                        return;
                    }
                    let p1Wins = 0;
                    let p2Wins = 0;
                    for (const set of match.result.split(' ')) {
                        p1Wins += parseInt(set.split('-')[0]?.split('(')[0]) || 0;
                        p2Wins += parseInt(set.split('-')[1]?.split('(')[0]) || 0;
                    }
                    return {
                        ...swapObjectValues(
                            {
                                breakPointsConverted1: match.stat.breakPointsConverted1,
                                breakPointsConverted2: match.stat.breakPointsConverted2,
                            },
                            match.player1.name === player,
                        ),
                        ...swapObjectValues(
                            {
                                breakPointsConvertedOf1: match.stat.breakPointsConvertedOf1,
                                breakPointsConvertedOf2: match.stat.breakPointsConvertedOf2,
                            },
                            match.player1.name === player,
                        ),
                        ...swapObjectValues(
                            {
                                totalPointsWon1: match.stat.totalPointsWon1,
                                totalPointsWon2: match.stat.totalPointsWon2,
                            },
                            match.player1.name === player,
                        ),
                        ...swapObjectValues(
                            {
                                unforcedErrors1: match.stat.unforcedErrors1,
                                unforcedErrors2: match.stat.unforcedErrors2,
                            },
                            match.player1.name === player,
                        ),
                        ...swapObjectValues(
                            {
                                fastestServe1: match.stat.fastestServe1,
                                fastestServe2: match.stat.fastestServe2,
                            },
                            match.player1.name === player,
                        ),
                        ...swapObjectValues(
                            {
                                averageFirstServeSpeed1: match.stat.averageFirstServeSpeed1,
                                averageFirstServeSpeed2: match.stat.averageFirstServeSpeed2,
                            },
                            match.player1.name === player,
                        ),
                        ...swapObjectValues(
                            {
                                averageSecondServeSpeed1: match.stat.averageSecondServeSpeed1,
                                averageSecondServeSpeed2: match.stat.averageSecondServeSpeed2,
                            },
                            match.player1.name === player,
                        ),
                        ...this.getGamesData(match.result, match.player1.name === player),
                        ...this.getDecidingSetStat(
                            match.result,
                            match.player1.name === player,
                        ),
                        ...this.getSetsWon(match.result, match.player1.name === player),
                        ...this.getTiebreaksWon(
                            match.result,
                            match.player1.name === player,
                        ),
                        ...this.getFirstSetWinMatchWin(
                            match.result,
                            match.player1.name === player,
                        ),
                        ...this.getFirstSetLoseMatchWin(
                            match.result,
                            match.player1.name === player,
                        ),
                        ...this.getAvgMatchTime(match.stat.mt),
                        ...swapObjectValues(
                            {
                                winsCountOnWin1: p1Wins,
                                winsCountOnWin2: p2Wins,
                            },
                            match.player1.name === player,
                        )
                    };
                })
                .forEach((stat) => {
                    // Нужно ли складывать данные по всем играм в текущем турнире для current event? как тогда отображать average serve speed?
                    result.averageFirstServeSpeed += fixNull(stat.averageFirstServeSpeed1);
                    result.averageSecondServeSpeed += fixNull(stat.averageSecondServeSpeed1);
                    result.avgTime += fixNull(stat.avgTime1);
                    result.firstServe += fixNull(stat.firstServe1);
                    result.firstServeOf += fixNull(stat.firstServeOf1);
                    result.breakPointsConverted += fixNull(stat.breakPointsConverted1);
                    result.breakPointsConvertedOf += fixNull(stat.breakPointsConvertedOf1);
                    result.breakPointsConverted2 += fixNull(stat.breakPointsConverted2);
                    result.breakPointsConvertedOf2 += fixNull(stat.breakPointsConvertedOf2);
                    result.totalPointsWon += fixNull(stat.totalPointsWon1);
                    result.unforcedErrors += fixNull(stat.unforcedErrors1);
                    result.decidingSetWin += stat.decidingSetWin1;
                    result.tiebreakWon += stat.tiebreakWon1;
                    if (result.fastestServe < stat.fastestServe1) {
                        result.fastestServe = stat.fastestServe1
                    }
                    result.winsCountOnWin1 = +stat.winsCountOnWin1;
                    result.winsCountOnWin2 = +stat.winsCountOnWin2;
                    result.avgOpponentRank = +stat.opponentRank2
                });

            let hours1 = Math.floor(result.avgTime / 1000 / 60 / 60);
            let minutes1: string = String(Math.floor(result.avgTime / 1000 / 60) % 60)
            let seconds1: string = String(Math.floor(result.avgTime / 1000) % 60)
            if (Number(minutes1) < 10) {
                minutes1 = '0' + minutes1
            }
            if (Number(seconds1) < 10) {
                seconds1 = '0' + seconds1
            }
            const time1 = `${hours1}:${minutes1}:${seconds1}`;

            let lastGameTime = this.getAvgMatchTime(matches[0].stat.mt)['avgTime1']
            hours1 = Math.floor(lastGameTime / 1000 / 60 / 60);
            minutes1 = String(Math.floor(lastGameTime / 1000 / 60) % 60)
            seconds1 = String(Math.floor(lastGameTime / 1000) % 60)
            if (Number(minutes1) < 10) {
                minutes1 = '0' + minutes1
            }
            if (Number(seconds1) < 10) {
                seconds1 = '0' + seconds1
            }
            let lastGameTimeStr = `${hours1}:${minutes1}:${seconds1}`;
            const response = {
                winsCountOnWin1: result.winsCountOnWin1,
                winsCountOnWin2: result.winsCountOnWin2,
                name: player,
                tourName: matches[0].tournament.name,
                country: matches[0].tournament.countryAcr,
                court: matches[0].tournament.court.name,
                averageFirstServeSpeed: result.averageFirstServeSpeed / matches.length,
                averageSecondServeSpeed: result.averageSecondServeSpeed / matches.length,
                fastestServe: result.fastestServe,
                lastMatchTime: lastGameTimeStr,
                totalTime: time1,
                matchesPlayed: matches.length,
                totalPointsWon: result.totalPointsWon,
                unforcedErrors: result.unforcedErrors,
                breakPointsSaved: result.breakPointsConvertedOf2 - result.breakPointsConverted2,
                breakPointsSavedOf: result.breakPointsConvertedOf2,
                breakPointsSavedPercentage: countPercentage(
                    result.breakPointsConvertedOf2 - result.breakPointsConverted2,
                    result.breakPointsConvertedOf2,
                ),
                serviceHold: result.winsCountOnWin1,
                serviceHoldOf: (result.winsCountOnWin1 + result.winsCountOnWin2),
                serviceHoldPercentage: countPercentage(
                    result.winsCountOnWin1,
                    (result.winsCountOnWin1 + result.winsCountOnWin2),
                ),
                oppHold: result.winsCountOnWin2,
                oppHoldOf: (result.winsCountOnWin1 + result.winsCountOnWin2),
                decidingSetWin: result.decidingSetWin,
                decidingSetWinPercentage: countPercentage(
                    result.decidingSetWin,
                    matches.length,
                ),
                tiebreakWon: result.tiebreakWon,
                totalTBWinPercentage: countPercentage(
                    result.tiebreakWon,
                    matches.length,
                ),
                avgOpponentRank: result.avgOpponentRank / matches.length
            };
            return response;
        });
    }

    public async findPlayerRecentMatches(
        type: TourType,
        player: string,
        query: MatchPlayedGameDto,
    ) {
        const gameRepo: Repository<GameAtp | GameWta> =
            type === TourType.ATP ? this.gameAtpRepo : this.gameWtaRepo;
        const statTourType = type === TourType.ATP ? 'StatAtp' : 'StatWta';
        const h2hTourType = type === TourType.ATP ? 'H2hAtp' : 'H2hWta';

        let response = gameRepo
            .createQueryBuilder('game')
            .leftJoinAndSelect('game.player1', 'winner')
            .leftJoinAndSelect('game.player2', 'loser')
            .leftJoinAndSelect('game.tournament', 'tour')
            .leftJoinAndMapOne(
                'game.stat',
                `${statTourType}`,
                'stat',
                '(stat.player1 = game.player1 and stat.player2 = game.player2 OR stat.player1 = game.player2 and stat.player2 = game.player1) and stat.tournament = tour.id',
            )
            .leftJoinAndMapOne(
                'game.h2h',
                `${h2hTourType}`,
                'h2h',
                '(h2h.player1 = game.player1 and h2h.player2 = game.player2)',
            )
            .where('(winner.name = :player OR loser.name = :player)', {player})
            .andWhere('game.date is not null')
            .orderBy('game.date', 'DESC');

        // if (query?.level) {
        //   response = response
        //     .leftJoin('tour.rank', 'rank')
        //     .andWhere('rank.id = :rankFilter', {
        //       rankFilter: query.level,
        //     });
        // }
        if (query?.court) {
            response = response
                .leftJoin('tour.court', 'court')
                .andWhere('LOWER(court.name) = LOWER(:courtFilter)', {
                    courtFilter: query.court,
                });
        }

        if (query?.year) {
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

        if (query?.round) {
            response = response
                .leftJoinAndSelect('game.round', 'round')
                .andWhere('LOWER(round.name) = LOWER(:roundFilter)', {
                    roundFilter: query.round,
                });
        }

        return response
            .limit(10)
            .offset(10 * ((query?.page || 1) - 1))
            .getMany()
            .then(async (games) => {
                return {
                    name: player,
                    count: await response.getCount(),
                    games: games.map((game) => {
                        return {
                            ...game,
                            isWin: game.player1.name === player,
                        };
                    }),
                };
            });
    }

    public async findUpcomingMatch(
        type: TourType,
        playerOne: string,
        playerTwo: string,
    ) {
        const todayRepo: Repository<TodayAtp | TodayWta> =
            type === TourType.ATP ? this.todayAtpRepo : this.todayWtaRepo;

        return todayRepo
            .createQueryBuilder('today')
            .leftJoin('today.player1', 'player1')
            .leftJoin('today.player2', 'player2')
            .leftJoin('today.round', 'round')
            .leftJoin('today.tournament', 'tournament')
            .leftJoin('tournament.court', 'court')
            .where(
                '(player1.name = :playerOne and player2.name = :playerTwo) OR (player2.name = :playerOne and player1.name = :playerTwo)',
                {playerOne, playerTwo},
            )
            .addSelect([
                'round.name',
                'player1.name',
                'player1.countryAcr',
                'player2.name',
                'player2.countryAcr',
                'tournament.name',
                'court.name',
            ])
            .andWhere('today.complete is null')
            .andWhere("today.result=''")
            .andWhere('today.live is null')
            .getOne();
    }

    public async findBreakdownStats(
        type: TourType,
        name: string,
        query: MatchPlayedGameDto,
    ) {
        const statRepo: Repository<StatAtp | StatWta> =
            type === TourType.ATP ? this.statAtpRepo : this.statWtaRepo;
        const playerRepo: Repository<PlayerAtp | PlayerWta> =
            type === TourType.ATP ? this.playerAtpRepo : this.playerWtaRepo;
        const playerStatRepo: Repository<PlayerStatAtp | PlayerStatWta> =
            type === TourType.ATP ? this.playerStatAtpRepo : this.playerStatWtaRepo;
        const player = await this.getPlayerByName(name, playerRepo);
        const playerId = player.id;
        const gameRepo: Repository<GameAtp | GameWta> =
            type === TourType.ATP ? this.gameAtpRepo : this.gameWtaRepo;

        const surfaceData = await this.getSurfaceData(playerId, gameRepo, query);
        const ytdWL = await this.getYTDWL(playerId, gameRepo, query);

        let response = await statRepo
            .createQueryBuilder('stat')
            .leftJoin('stat.player1', 'winner')
            .leftJoin('stat.player2', 'loser')
            .addSelect([
                'winner.id',
                'winner.name',
                'loser.id',
                'loser.name',
                'winner.currentRank',
                'loser.currentRank',
            ])
            .leftJoinAndSelect('stat.tournament', 'tour')
            .leftJoinAndSelect('tour.court', 'court')
            .leftJoinAndSelect('tour.rank', 'rank')
            .leftJoinAndMapOne(
                'stat.game',
                GameAtp,
                'game',
                "(game.player1 = stat.player1 and game.player2 = stat.player2 OR game.player1 = stat.player2 and game.player2 = stat.player1) and game.tournament = tour.id",
            )
            .where('(winner.name = :name OR loser.name = :name)', {name})
            .andWhere('tour.rankId != 0')
            .andWhere('tour.rankId != 1')
            .andWhere('tour.rankId != 6')
            .andWhere('game.roundId != 0')
            .andWhere('game.roundId != 1')
            .andWhere('game.roundId != 2')
            .andWhere('game.roundId != 3')
            .andWhere('game.result is not null')
            .andWhere('game.date is not null')
            .andWhere("game.result != 'w/o'")
            .andWhere("game.result != 'bye'")
            .andWhere("game.result != ''")
            .andWhere("game.result not like '%ret%'")
            .orderBy('tour.date', 'DESC');

        if (query?.court) {
            response = response.andWhere('LOWER(court.name) in (:...courtFilter)', {
                courtFilter: query.court.split(',').map((name) => name.toLowerCase()),
            });
        }
        if (query?.round) {
            response = response
                .leftJoinAndSelect('game.round', 'round')
                .andWhere('LOWER(round.name) = LOWER(:roundFilter)', {
                    roundFilter: query.round,
                });
        }
        if (query?.level) {
            if (query.level == 3) {
                response = response.andWhere(
                    `rank.id = :rankId and tour.name not like '%ATP Finals%'`,
                    {
                        rankId: query.level,
                    },
                );
            } else {
                response = response.andWhere('rank.id = :rankId', {
                    rankId: query.level,
                });
            }
        }
        if (query?.year) {
            response = response.andWhere(`tour.date BETWEEN :year and :nextYear`, {
                year: `${query.year}-01-01`,
                nextYear: `${query.year}-12-31`,
            });
        }
        if (query?.tournament) {
            response = response.andWhere('tour.name = :tourName', {
                tourName: query.tournament,
            });
        }

        // TODO расчеты выдают неизвестно что даже когда игр нет
        return response.getMany().then(async (stats: any) => {
            const result = {
                hard1: 0,
                hard2: 0,
                iHard1: 0,
                iHard2: 0,
                clay1: 0,
                clay2: 0,
                grass1: 0,
                grass2: 0,
                totalAces1: 0,
                totalAces2: 0,
                totalDF1: 0,
                totalDF2: 0,
                doubleFaults1: 0,
                doubleFaults2: 0,
                firstServe1: 0,
                firstServe2: 0,
                firstServeOf1: 0,
                firstServeOf2: 0,
                winningOnFirstServe1: 0,
                winningOnFirstServe2: 0,
                winningOnFirstServeOf1: 0,
                winningOnFirstServeOf2: 0,
                winningOnSecondServe1: 0,
                winningOnSecondServe2: 0,
                winningOnSecondServeOf1: 0,
                winningOnSecondServeOf2: 0,
                breakPointsConverted1: 0,
                breakPointsConvertedOf1: 0,
                breakPointsConverted2: 0,
                breakPointsConvertedOf2: 0,
                totalPointsWon: 0,
                rank: 0,
                gamesServed: 0,
                gamesWon1: 0,
                gamesWon2: 0,
                setsWon1: 0,
                setsWon2: 0,
                bestOfThreeWon1: 0,
                bestOfThreeWonPercentage1: 0,
                bestOfThreeWon2: 0,
                bestOfThreeWonPercentage2: 0,
                bestOfFiveWon1: 0,
                bestOfFiveWonPercentage1: 0,
                bestOfFiveWon2: 0,
                bestOfFiveWonPercentage2: 0,
                bestOfThreeCount: 0,
                bestOfFiveCount: 0,
                decidingSetWin1: 0,
                decidingSetWin2: 0,
                decidingSetWinPercentage1: 0,
                decidingSetWinPercentage2: 0,
                tiebreakWon1: 0,
                tiebreakWon2: 0,
                matchesWon1: 0,
                matchesWon2: 0,
                firstSetWinMatchWin1: 0,
                firstSetWinMatchWin2: 0,
                firstSetWinMatchLose1: 0,
                firstSetWinMatchLose2: 0,
                firstSetLoseMatchWin1: 0,
                firstSetLoseMatchWin2: 0,
                firstSetWinCount: 0,
                firstSetLoseCount: 0,
                returnPtsWin1: 0,
                returnPtsWin2: 0,
                returnPtsWinOf1: 0,
                returnPtsWinOf2: 0,
                returnPtsWinPercentage1: 0,
                returnPtsWinPercentage2: 0,
                matchesCount: await response.getCount(),
                avgTime1: 0,
                avgTime2: 0,
                totalDoubleFaultsCount: 0,
            };

            stats
                .map((stat: any) => {
                    return {
                        ...swapObjectValues(
                            {
                                returnPtsWin1: stat.rpw1,
                                returnPtsWin2: stat.rpw2
                            },
                            stat.player1.id === playerId,
                        ),
                        ...swapObjectValues(
                            {
                                returnPtsWinOf1: stat.rpwOf1,
                                returnPtsWinOf2: stat.rpwOf2
                            },
                            stat.player1.id === playerId,
                        ),
                        ...swapObjectValues(
                            {
                                aces1: stat.aces1,
                                aces2: stat.aces2
                            },
                            stat.player1.id === playerId,
                        ),
                        ...swapObjectValues(
                            {
                                rank1: stat.player1.currentRank,
                                rank2: stat.player2.currentRank,
                            },
                            stat.player1.id === playerId,
                        ),
                        ...swapObjectValues(
                            {
                                doubleFaults1: stat.doubleFaults1,
                                doubleFaults2: stat.doubleFaults2,
                            },
                            stat.player1.id === playerId,
                        ),
                        ...swapObjectValues(
                            {firstServe1: stat.firstServe1, firstServe2: stat.firstServe2},
                            stat.player1.id === playerId,
                        ),
                        ...swapObjectValues(
                            {
                                firstServeOf1: stat.firstServeOf1,
                                firstServeOf2: stat.firstServeOf2,
                            },
                            stat.player1.id === playerId,
                        ),
                        ...swapObjectValues(
                            {
                                winningOnFirstServe1: stat.winningOnFirstServe1,
                                winningOnFirstServe2: stat.winningOnFirstServe2,
                            },
                            stat.player1.id === playerId,
                        ),
                        ...swapObjectValues(
                            {
                                winningOnFirstServeOf1: stat.winningOnFirstServeOf1,
                                winningOnFirstServeOf2: stat.winningOnFirstServeOf2,
                            },
                            stat.player1.id === playerId,
                        ),
                        ...swapObjectValues(
                            {
                                winningOnSecondServe1: stat.winningOnSecondServe1,
                                winningOnSecondServe2: stat.winningOnSecondServe2,
                            },
                            stat.player1.id === playerId,
                        ),
                        ...swapObjectValues(
                            {
                                winningOnSecondServeOf1: stat.winningOnSecondServeOf1,
                                winningOnSecondServeOf2: stat.winningOnSecondServeOf2,
                            },
                            stat.player1.id === playerId,
                        ),
                        ...swapObjectValues(
                            {
                                breakPointsConverted1: stat.breakPointsConverted1,
                                breakPointsConverted2: stat.breakPointsConverted2,
                            },
                            stat.player1.id === playerId,
                        ),
                        ...swapObjectValues(
                            {
                                breakPointsConvertedOf1: stat.breakPointsConvertedOf1,
                                breakPointsConvertedOf2: stat.breakPointsConvertedOf2,
                            },
                            stat.player1.id === playerId,
                        ),
                        ...swapObjectValues(
                            {
                                totalPointsWon1: stat.totalPointsWon1,
                                totalPointsWon2: stat.totalPointsWon2,
                            },
                            stat.player1.id === playerId,
                        ),
                        ...this.getGamesData(
                            stat?.game?.result,
                            stat.player1.id === playerId,
                        ),
                        ...this.getDecidingSetStat(
                            stat?.game?.result,
                            stat.player1.id === playerId,
                        ),
                        ...this.getSetsWon(
                            stat?.game?.result,
                            stat.player1.id === playerId,
                        ),
                        ...this.getTiebreaksWon(
                            stat?.game?.result,
                            stat.player1.id === playerId,
                        ),
                        ...this.getBestOfStat(
                            stat?.game?.result,
                            stat.player1.id === playerId,
                        ),
                        ...this.getFirstSetWinMatchWin(
                            stat?.game?.result,
                            stat.player1.id === playerId,
                        ),
                        ...this.getFirstSetWinMatchLose(
                            stat?.game?.result,
                            stat.player1.id === playerId,
                        ),
                        ...this.getFirstSetLoseMatchWin(
                            stat?.game?.result,
                            stat.player1.id === playerId,
                        ),
                        ...this.getAvgMatchTime(stat.mt),
                        ...this.GetFirstSetWinLoseCount(
                            stat.game.result,
                            stat.player1.id === playerId,
                        ),
                    };
                })
                .forEach((stat: any) => {
                    result.returnPtsWin1 += fixNull(stat.returnPtsWin1)
                    result.returnPtsWin2 += fixNull(stat.returnPtsWin2)
                    result.returnPtsWinOf1 += fixNull(stat.returnPtsWinOf1)
                    result.returnPtsWinOf2 += fixNull(stat.returnPtsWinOf2)
                    result.totalAces1 += fixNull(stat.aces1);
                    result.totalAces2 += fixNull(stat.aces2);
                    result.totalDF1 += fixNull(stat.doubleFaults1);
                    result.totalDF2 += fixNull(stat.doubleFaults2);
                    result.firstServe1 += fixNull(stat.firstServe1);
                    result.firstServe2 += fixNull(stat.firstServe2);
                    result.firstServeOf1 += fixNull(stat.firstServeOf1);
                    result.firstServeOf2 += fixNull(stat.firstServeOf2);
                    result.rank += fixNull(stat.rank2);
                    result.winningOnFirstServe1 += fixNull(stat.winningOnFirstServe1);
                    result.winningOnFirstServe2 += fixNull(stat.winningOnFirstServe2);
                    result.winningOnFirstServeOf1 += fixNull(stat.winningOnFirstServeOf1);
                    result.winningOnFirstServeOf2 += fixNull(stat.winningOnFirstServeOf2);
                    result.winningOnSecondServe1 += fixNull(stat.winningOnSecondServe1);
                    result.winningOnSecondServe2 += fixNull(stat.winningOnSecondServe2);
                    result.winningOnSecondServeOf1 += fixNull(
                        stat.winningOnSecondServeOf1,
                    );
                    result.winningOnSecondServeOf2 += fixNull(
                        stat.winningOnSecondServeOf2,
                    );
                    result.breakPointsConverted1 += fixNull(stat.breakPointsConverted1);
                    result.breakPointsConverted2 += fixNull(stat.breakPointsConverted2);
                    result.breakPointsConvertedOf1 += fixNull(
                        stat.breakPointsConvertedOf1,
                    );
                    result.breakPointsConvertedOf2 += fixNull(
                        stat.breakPointsConvertedOf2,
                    );
                    result.totalPointsWon += fixNull(stat.totalPointsWon1);
                    result.bestOfThreeWon1 += stat.bestOfThreeWon1;
                    result.bestOfThreeWon2 += stat.bestOfThreeWon2;
                    result.bestOfFiveWon1 += stat.bestOfFiveWon1;
                    result.bestOfFiveWon2 += stat.bestOfFiveWon2;
                    result.bestOfThreeCount += stat.bestOfThreeWon1 + stat.bestOfThreeWon2,
                        result.bestOfFiveCount += stat.bestOfFiveWon1 + stat.bestOfFiveWon2,
                        result.setsWon1 += stat.setsWon1;
                    result.setsWon2 += stat.setsWon2;
                    result.decidingSetWin1 += stat.decidingSetWin1;
                    result.decidingSetWin2 += stat.decidingSetWin2;
                    result.tiebreakWon1 += stat.tiebreakWon1;
                    result.tiebreakWon2 += stat.tiebreakWon2;
                    result.hard1 += stat.hard1 ?? 0;
                    result.hard2 += stat.hard2 ?? 0;
                    result.clay1 += stat.clay1 ?? 0;
                    result.clay2 += stat.clay2 ?? 0;
                    result.iHard1 += stat.iHard1 ?? 0;
                    result.iHard2 += stat.iHard2 ?? 0;
                    result.grass1 += stat.grass1 ?? 0;
                    result.grass2 += stat.grass2 ?? 0;
                    result.gamesWon1 += stat.gamesWon1 ?? 0;
                    result.gamesWon2 += stat.gamesWon2 ?? 0;
                    result.gamesServed += stat.gamesServed ?? 0;

                    result.firstSetWinMatchWin1 += stat.firstSetWinMatchWin1;
                    result.firstSetWinMatchWin2 += stat.firstSetWinMatchWin2;
                    result.firstSetWinMatchLose1 += stat.firstSetWinMatchLose1;
                    result.firstSetWinMatchLose2 += stat.firstSetWinMatchLose2;
                    result.firstSetLoseMatchWin1 += stat.firstSetLoseMatchWin1;
                    result.firstSetLoseMatchWin2 += stat.firstSetLoseMatchWin2;
                    result.firstSetWinCount += stat.firstSetWinCount;
                    result.firstSetLoseCount += stat.firstSetLoseCount;
                    result.avgTime1 += stat.avgTime1;
                    result.avgTime2 += stat.avgTime2;
                });

            result.matchesWon1 = result.bestOfFiveWon1 + result.bestOfThreeWon1;
            result.matchesWon2 = result.bestOfFiveWon2 + result.bestOfThreeWon2;

            // расчеты

            const milliseconds1 = new Date(
                result.avgTime1 / result.matchesCount,
            ).getTime();
            const milliseconds2 = new Date(
                result.avgTime2 / result.matchesCount,
            ).getTime();
            const hours1 = Math.floor(milliseconds1 / 1000 / 60 / 60);
            const hours2 = Math.floor(milliseconds2 / 1000 / 60 / 60);
            const minutes1 = Math.floor(milliseconds1 / 1000 / 60) % 60;
            const minutes2 = Math.floor(milliseconds2 / 1000 / 60) % 60;
            const seconds1 = Math.floor(milliseconds1 / 1000) % 60;
            const seconds2 = Math.floor(milliseconds2 / 1000) % 60;

            const time1 = (hours1 && minutes1 && seconds1) ? `${hours1}:${minutes1}:${seconds1}` : 'N/A';
            const time2 = (hours2 && minutes2 && seconds2) ? `${hours2}:${minutes2}:${seconds2}` : 'N/A';
            const res = {
                ...await this.getMatchesData(playerId, gameRepo, query),
                matchesCount: result.matchesCount,
                name,
                avgTime1: time1,
                avgTime2: time2,
                matchesWon1: result.matchesWon1,
                matchesWon2: result.matchesWon2,
                gamesWon1: result.gamesWon1,
                gamesWon2: result.gamesWon2,
                totalPointsWon: result.totalPointsWon,
                setsWon1: result.setsWon1,
                setsWon2: result.setsWon2,
                ...surfaceData,
                aces: divideNumbers(result.totalAces1, result.gamesServed),
                acesTotal: result.totalAces1,
                doubleFaultsCount: divideNumbers(result.totalDF1, result.gamesServed),
                firstServe: result.firstServe1,
                firstServeOf: result.firstServeOf1,
                firstServePercentage: countPercentage(
                    result.firstServe1,
                    result.firstServeOf1,
                ),
                winningOnFirstServe: result.winningOnFirstServe1,
                winningOnFirstServeOf: result.winningOnFirstServeOf1,
                winningOnFirstServePercentage: countPercentage(
                    result.winningOnFirstServe1,
                    result.winningOnFirstServeOf1,
                ),
                winningOnSecondServe: result.winningOnSecondServe1,
                winningOnSecondServeOf: result.winningOnSecondServeOf1,
                winningOnSecondServePercentage: countPercentage(
                    result.winningOnSecondServe1,
                    result.winningOnSecondServeOf1,
                ),
                returnPtsWin: result.returnPtsWin1,
                returnPtsWinOf: result.returnPtsWinOf1,
                returnPtsWinPercentage: countPercentage(
                    result.returnPtsWin1,
                    result.returnPtsWinOf1,
                ),
                breakPointsConverted: result.breakPointsConverted1,
                breakPointsConvertedOf: result.breakPointsConvertedOf1,
                breakpointsWonPercentage: countPercentage(
                    result.breakPointsConverted1,
                    result.breakPointsConvertedOf1,
                ),
                bestOfThreeWon: result.bestOfThreeWon1,
                bestOfThreeWonPercentage: countPercentage(
                    result.bestOfThreeWon1,
                    result.bestOfThreeCount,
                ),
                bestOfThreeCount: result.bestOfThreeCount,
                bestOfFiveWon: result.bestOfFiveWon1,
                bestOfFiveWonPercentage: countPercentage(
                    result.bestOfFiveWon1,
                    result.bestOfFiveCount,
                ),
                bestOfFiveCount: result.bestOfFiveCount,
                firstSetWinMatchWin: result.firstSetWinMatchWin1,
                firstSetWinMatchWinPercentage: countPercentage(
                    result.firstSetWinMatchWin1,
                    result.firstSetWinCount,
                ),
                firstSetWinMatchLose: result.firstSetWinMatchLose1,
                firstSetWinMatchLosePercentage: countPercentage(
                    result.firstSetWinMatchLose1,
                    result.firstSetWinCount,
                ),
                firstSetLoseMatchWin: result.firstSetLoseMatchWin1,
                firstSetLoseMatchWinPercentage: countPercentage(
                    result.firstSetLoseMatchWin1,
                    result.firstSetLoseCount,
                ),
                firstSetWinCount: result.firstSetWinCount,
                firstSetLoseCount: result.firstSetLoseCount,
                decidingSetWin: result.decidingSetWin1,
                decidingSetCount: result.decidingSetWin1 + result.decidingSetWin2,
                decidingSetWinPercentage: countPercentage(
                    result.decidingSetWin1,
                    result.decidingSetWin1 + result.decidingSetWin2,
                ),
                tiebreakWon: result.tiebreakWon1,
                tiebreakCount: result.tiebreakWon1 + result.tiebreakWon2,
                totalTBWinPercentage: countPercentage(
                    result.tiebreakWon1,
                    result.tiebreakWon1 + result.tiebreakWon2,
                ),
                avgOppRank: divideNumbers(result.rank, result.matchesCount),
                ...ytdWL,
                totalDoubleFaultsCount: result.totalDF1,

            };

            return res;
        });
    }

    public async findFiltersVs(type: TourType, playerName1: string, playerName2) {
        let playerRepo = this.playerAtpRepo;
        let tournamentRepo = this.tournamentAtpRepository;
        let gameRepo = this.gameAtpRepo;
        if (type === TourType.WTA) {
            playerRepo = this.playerWtaRepo;
            tournamentRepo = this.tournamentWtaRepository;
            gameRepo = this.gameWtaRepo;
        }
        const playerResult1 = await this.getPlayerByName(
            playerName1,
            playerRepo,
        );
        const playerResult2 = await this.getPlayerByName(
            playerName2,
            playerRepo,
        );

        return {
            courts: await this.courtRepository.find(),
            rounds: await this.getRounds(),
            level: await this.rankRepository.find(),
            tournaments: await tournamentRepo
                .createQueryBuilder('tournament')
                .select(['tournament.name', 'tournament.date'])
                .leftJoin('tournament.games', 'games')
                .where(
                    '(games.player1 = :player1Id or games.player2 = :player1Id) and (games.player1 = :player2Id or games.player2 = :player2Id)',
                    {
                        player1Id: playerResult1.id,
                        player2Id: playerResult2.id,
                    },
                )
                .getMany()
                .then((tournaments: any) =>
                    tournaments.map((tournament) => ({
                        name: tournament.name,
                        date: new Date(tournament.date).getFullYear().toString(),
                    })),
                ),
            years: await gameRepo
                .createQueryBuilder('game')
                .where(
                    '(game.player1 = :player1Id or game.player2 = :player1Id) and (game.player1 = :player2Id or game.player2 = :player2Id)',
                    {
                        player1Id: playerResult1.id,
                        player2Id: playerResult2.id,
                    },
                )
                .andWhere('game.date is not null')
                .select('EXTRACT(year from game.date)', 'year')
                .distinctOn(['year'])
                .orderBy('year', 'DESC')
                .getRawMany()
                .then((games: any) =>
                    games.map((game) => game.year).filter((game) => game),
                ),
        };
    }

    public async findFilters(type: TourType, playerName1: string, playerName2) {
        const playerResult1 = await this.getPlayerByName(
            playerName1,
            this.playerAtpRepo,
        );
        const playerResult2 = await this.getPlayerByName(
            playerName2,
            this.playerAtpRepo,
        );

        return {
            courts: await this.courtRepository.find(),
            rounds: await this.getRounds(),
            level: await this.rankRepository.find(),
            tournaments: await this.tournamentAtpRepository
                .createQueryBuilder('tournament')
                .select(['tournament.name', 'tournament.date'])
                .leftJoin('tournament.games', 'games')
                .where(
                    '(games.player1 = :player1Id or games.player2 = :player1Id) or (games.player1 = :player2Id or games.player2 = :player2Id)',
                    {
                        player1Id: playerResult1.id,
                        player2Id: playerResult2.id,
                    },
                )
                .getMany()
                .then((tournaments: any) =>
                    tournaments.map((tournament) => ({
                        name: tournament.name,
                        date: new Date(tournament.date).getFullYear().toString(),
                    })),
                ),
            years: await this.gameAtpRepo
                .createQueryBuilder('game')
                .where(
                    '(game.player1 = :player1Id or game.player2 = :player1Id) or (game.player1 = :player2Id or game.player2 = :player2Id)',
                    {
                        player1Id: playerResult1.id,
                        player2Id: playerResult2.id,
                    },
                )
                .andWhere('game.date is not null')
                .select('EXTRACT(year from game.date)', 'year')
                .distinctOn(['year'])
                .orderBy('year', 'DESC')
                .getRawMany()
                .then((games: any) =>
                    games.map((game) => game.year).filter((game) => game),
                ),
        };
    }

    private async getRounds() {
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

    private getSetsWon(score: string, isPlayerOneWon: boolean) {
        const result = {
            setsWon1: 0,
            setsWon2: 0,
        };
        if (!score) return result;

        let temp: number;

        const arr = score.split(' ').map((a) => a.split('-'));
        for (let i = 0; i < arr.length; i++) {
            if (!isNaN(parseInt(arr[i][0])) && arr[i][0] != 'ret.') {
                if (parseInt(arr[i][0]) > parseInt(arr[i][1])) {
                    result.setsWon1++
                }
                if (parseInt(arr[i][0]) < parseInt(arr[i][1])) {
                    result.setsWon2++
                }
            }
            if (arr[i][0] == 'ret.') {
                result.setsWon1++
            }
        }

        if (!isPlayerOneWon) {
            temp = result.setsWon1;
            result.setsWon1 = result.setsWon2;
            result.setsWon2 = temp;
        }

        return result;
    }

    private getTiebreaksWon(score: string, isPlayerOneWon: boolean) {
        const result = {
            tiebreakWon1: 0,
            tiebreakWon2: 0,
        };
        if (!score) return result;

        const arr = score.split(' ').map((a) => a.split('-'));
        for (let i = 0; i < arr.length; i++) {
            if (!isNaN(parseInt(arr[i][0])) && arr[i][1].includes('(')) {
                isPlayerOneWon
                    ? result.tiebreakWon1++
                    : result.tiebreakWon2++;
            }
        }

        return result;
    }

    private getBestOfStat(score: string, isPlayerOneWon: boolean) {
        const result = {
            bestOfThreeWon1: 0,
            bestOfThreeWon2: 0,
            bestOfFiveWon1: 0,
            bestOfFiveWon2: 0,
        };
        let player1Wins = 0;
        if (!score) return result;

        const arr = score.split(' ').map((a) => a.split('-'));

        for (let i = 0; i < arr.length; i++) {
            if (!isNaN(parseInt(arr[i][0]))) {
                parseInt(arr[i][0]) > parseInt(arr[i][1]) && player1Wins++;
            }
            if (arr[i][0] == 'ret.') {
                player1Wins++
            }
        }
        if (arr.length < 4 && player1Wins != 3) {
            if (player1Wins >= 2) {
                isPlayerOneWon ? result.bestOfThreeWon1++ : result.bestOfThreeWon2++;
                return result;
            }
        } else {
            isPlayerOneWon ? result.bestOfFiveWon1++ : result.bestOfFiveWon2++;
            return result;
        }

        return result;
    }

    private getDecidingSetStat(score: string, isPlayerOneWon: boolean) {
        const result = {
            decidingSetWin1: 0,
            decidingSetWin2: 0,
        };
        let player2Wins = 0;
        if (!score) return result;

        const arr = score.split(' ').map((a) => a.split('-'));

        for (let i = 0; i < arr.length; i++) {
            if (!isNaN(parseInt(arr[i][0]))) {
                parseInt(arr[i][0]) < parseInt(arr[i][1]) && player2Wins++;
            }
        }

        if (player2Wins === 2 && arr.length == 5) {
            isPlayerOneWon ? result.decidingSetWin1++ : result.decidingSetWin2++;
            return result;
        }
        if (player2Wins === 1 && arr.length == 3) {
            isPlayerOneWon ? result.decidingSetWin1++ : result.decidingSetWin2++;
            return result;
        }

        return result;
    }

    private getCourtStat(courtId: number, isPlayerOneWon: boolean) {
        const result = {
            hard1: 0,
            hard2: 0,
            iHard1: 0,
            iHard2: 0,
            clay1: 0,
            clay2: 0,
            grass1: 0,
            grass2: 0,
            total1: 0,
            total2: 0,
        };
        switch (courtId) {
            case 1:
                isPlayerOneWon ? result.hard1++ : result.hard2++;
                return result;
            case 2:
                isPlayerOneWon ? result.clay1++ : result.clay2++;
                return result;
            case 3:
                isPlayerOneWon ? result.iHard1++ : result.iHard2++;
                return result;
            case 4:
                isPlayerOneWon ? result.iHard1++ : result.iHard2++;
                return result;
            case 6:
                isPlayerOneWon ? result.iHard1++ : result.iHard2++;
                return result;
            case 5:
                isPlayerOneWon ? result.grass1++ : result.grass2++;
                return result;
            default:
                return result;
        }
    }

    private getTournamentRank(
        rankId,
        roundId,
        isPlayerOneWon,
    ) {
        const result = {
            slam1: 0,
            slam2: 0,
            title1: 0,
            title2: 0,
            master1: 0,
            master2: 0,
            main1: 0,
            main2: 0,
            cup1: 0,
            cup2: 0,
            future1: 0,
            future2: 0,
            challengers1: 0,
            challengers2: 0,
            tourFinals1: 0,
            tourFinals2: 0,
        };
        if ([0, 1, 2, 3].indexOf(roundId) == -1 && rankId == 2) {
            isPlayerOneWon ? result.main1++ : result.main2++;
        }
        if ([0, 1, 2, 3].indexOf(roundId) == -1 && rankId == 4) {
            isPlayerOneWon ? result.slam1++ : result.slam2++;
        }
        if ([0, 1, 2, 3].indexOf(roundId) == -1 && rankId == 5) {
            isPlayerOneWon ? result.cup1++ : result.cup2++;
        }
        if ([0, 1, 2, 3].indexOf(roundId) == -1 && rankId == 0) {
            isPlayerOneWon ? result.future1++ : result.future2++;
        }
        if ([0, 1, 2, 3].indexOf(roundId) == -1 && rankId == 1) {
            isPlayerOneWon ? result.challengers1++ : result.challengers2++;
        }
        if ([2, 3, 4, 7, 8, 9].indexOf(rankId) > -1 && roundId == 12) {
            isPlayerOneWon ? result.title1++ : result.title2++;
        }
        if ([0, 1, 2, 3].indexOf(roundId) == -1 && rankId == 3) {
            isPlayerOneWon ? result.master1++ : result.master2++;
        }
        if ([0, 1, 2, 3].indexOf(roundId) == -1 && rankId == 7) {
            isPlayerOneWon ? result.tourFinals1++ : result.tourFinals2++;
        }
        return result;
    }

    private getGamesData(score: string, isPlayerOneWon: boolean) {
        const result = {
            gamesWon1: 0,
            gamesWon2: 0,
            gamesServed: 0,
        };

        if (!score) return result;

        const arr = score.split(' ').map((a) => a.split('-'));

        for (let i = 0; i < arr.length; i++) {
            if (!isNaN(parseInt(arr[i][0]))) {
                result.gamesWon1 += parseInt(arr[i][0]);
                result.gamesWon2 += parseInt(arr[i][1]);
            }
        }

        if (result.gamesWon1 === 0 && result.gamesWon2 === 0) {
            return result;
        }

        if (!isPlayerOneWon) {
            result.gamesWon1 = result.gamesWon1 ^ result.gamesWon2;
            result.gamesWon2 = result.gamesWon1 ^ result.gamesWon2;
            result.gamesWon1 = result.gamesWon1 ^ result.gamesWon2;
        }

        result.gamesServed = Math.floor((result.gamesWon1 + result.gamesWon2) / 2);
        return result;
    }

    private getFirstSetWinMatchWin(score: string, isPlayerOneWon: boolean) {
        const result = {
            firstSetWinMatchWin1: 0,
            firstSetWinMatchWin2: 0,
        };

        const result2 = {
            setsWon1: 0,
            setsWon2: 0,
        };
        if (!score) return result;

        let temp: number;

        const arr = score.split(' ').map((a) => a.split('-'));
        for (let i = 0; i < arr.length; i++) {
            if (!isNaN(parseInt(arr[i][0])) && arr[i][0] != 'ret.') {
                if (parseInt(arr[i][0]) > parseInt(arr[i][1])) {
                    result2.setsWon1++
                }
                if (parseInt(arr[i][0]) < parseInt(arr[i][1])) {
                    result2.setsWon2++
                }
            }
            if (arr[i][0] == 'ret.') {
                result2.setsWon1++
            }
        }

        if (parseInt(arr[0][0]) > parseInt(arr[0][1]) && result2.setsWon1 > result2.setsWon2) {
            result.firstSetWinMatchWin1++
        }
        if (parseInt(arr[0][0]) < parseInt(arr[0][1]) && result2.setsWon1 < result2.setsWon2) {
            result.firstSetWinMatchWin2++
        }
        if (!isPlayerOneWon) {
            temp = result.firstSetWinMatchWin1;
            result.firstSetWinMatchWin1 = result.firstSetWinMatchWin2;
            result.firstSetWinMatchWin2 = temp;
        }
        return result;
    }

    private getFirstSetWinMatchLose(score: string, isPlayerOneWon: boolean) {
        const result = {
            firstSetWinMatchLose1: 0,
            firstSetWinMatchLose2: 0,
        };

        const result2 = {
            setsWon1: 0,
            setsWon2: 0,
        };
        if (!score) return result;

        let temp: number;

        const arr = score.split(' ').map((a) => a.split('-'));
        for (let i = 0; i < arr.length; i++) {
            if (!isNaN(parseInt(arr[i][0])) && arr[i][0] != 'ret.') {
                if (parseInt(arr[i][0]) > parseInt(arr[i][1])) {
                    result2.setsWon1++
                }
                if (parseInt(arr[i][0]) < parseInt(arr[i][1])) {
                    result2.setsWon2++
                }
            }
            if (arr[i][0] == 'ret.') {
                result2.setsWon1++
            }
        }

        if (parseInt(arr[0][0]) > parseInt(arr[0][1]) && result2.setsWon1 < result2.setsWon2) {
            result.firstSetWinMatchLose1++
        }
        if (parseInt(arr[0][0]) < parseInt(arr[0][1]) && result2.setsWon1 > result2.setsWon2) {
            result.firstSetWinMatchLose2++
        }
        if (!isPlayerOneWon) {
            temp = result.firstSetWinMatchLose1;
            result.firstSetWinMatchLose1 = result.firstSetWinMatchLose2;
            result.firstSetWinMatchLose2 = temp;
        }
        return result;
    }

    private getFirstSetLoseMatchWin(score: string, isPlayerOneWon: boolean) {
        const result = {
            firstSetLoseMatchWin1: 0,
            firstSetLoseMatchWin2: 0,
        };

        const result2 = {
            setsWon1: 0,
            setsWon2: 0,
        };
        if (!score) return result;

        let temp: number;

        const arr = score.split(' ').map((a) => a.split('-'));
        for (let i = 0; i < arr.length; i++) {
            if (!isNaN(parseInt(arr[i][0])) && arr[i][0] != 'ret.') {
                if (parseInt(arr[i][0]) > parseInt(arr[i][1])) {
                    result2.setsWon1++
                }
                if (parseInt(arr[i][0]) < parseInt(arr[i][1])) {
                    result2.setsWon2++
                }
            }
            if (arr[i][0] == 'ret.') {
                result2.setsWon1++
            }
        }

        if (parseInt(arr[0][0]) < parseInt(arr[0][1]) && result2.setsWon1 > result2.setsWon2) {
            result.firstSetLoseMatchWin1++
        }
        if (parseInt(arr[0][0]) > parseInt(arr[0][1]) && result2.setsWon1 < result2.setsWon2) {
            result.firstSetLoseMatchWin2++
        }
        if (!isPlayerOneWon) {
            temp = result.firstSetLoseMatchWin1;
            result.firstSetLoseMatchWin1 = result.firstSetLoseMatchWin2;
            result.firstSetLoseMatchWin2 = temp;
        }
        return result;
    }

    private GetFirstSetWinLoseCount(score: string, isPlayerOneWon: boolean) {
        const result = {
            firstSetWinCount: 0,
            firstSetLoseCount: 0,
        };
        if (!score) return result;

        let temp: number;

        const arr = score.split(' ').map((a) => a.split('-'));
        if (!isNaN(parseInt(arr[0][0])) && arr[0][0] != 'ret.') {
            if (parseInt(arr[0][0]) > parseInt(arr[0][1])) {
                result.firstSetWinCount++
            }
            if (parseInt(arr[0][0]) < parseInt(arr[0][1])) {
                result.firstSetLoseCount++
            }
        }
        if (arr[0][0] == 'ret.') {
            result.firstSetWinCount++
        }
        if (!isPlayerOneWon) {
            temp = result.firstSetWinCount;
            result.firstSetWinCount = result.firstSetLoseCount;
            result.firstSetLoseCount = temp;
        }
        return result;
    }

    private getAvgMatchTime(matchTime: string) {
        const result = {
            avgTime1: 0,
            avgTime2: 0,
        };

        if (!matchTime) {
            return result;
        }

        matchTime = matchTime.slice(11);
        const [hours, minutes, seconds] = matchTime
            .split(':')
            .map((v) => parseInt(v));

        const milliseconds =
            seconds * 1000 + minutes * 1000 * 60 + hours * 1000 * 60 * 60;

        result.avgTime1 += milliseconds;
        result.avgTime2 += milliseconds;

        return result;
    }

    private recentGame(
        playerId: number,
        gameRepository: Repository<GameAtp> | Repository<GameWta>,
    ) {
        return gameRepository
            .createQueryBuilder('game')
            .leftJoin('game.player1', 'player1')
            .leftJoin('game.player2', 'player2')
            .leftJoinAndSelect('game.tournament', 'tour')
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
                {playerId: playerId},
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

    private recentGameNoLimit(
        playerId: number,
        gameRepository: Repository<GameAtp> | Repository<GameWta>,
    ) {
        return gameRepository
            .createQueryBuilder('game')
            .leftJoin('game.player1', 'player1')
            .leftJoin('game.player2', 'player2')
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
                {playerId: playerId},
            )
            .orderBy('game.date', 'DESC');
    }

    private async getPlayerStat(
        playerId: number,
        playerStatRepo: Repository<PlayerStatAtp> | Repository<PlayerStatWta>,
    ) {
        let response = await playerStatRepo
            .createQueryBuilder('stat')
            .where('stat.player = :playerId', {playerId})
            .getOne()
            .then(async (playerStat) => {
                let stat = []
                if (playerStat != undefined) {
                    stat = JSON.parse(playerStat.data);
                }
                const mainTours = {wins: 0, losses: 0};
                const tourFinals = {wins: 0, losses: 0};
                const master = {wins: 0, losses: 0};
                const grandSlam = {wins: 0, losses: 0};
                const cups = {wins: 0, losses: 0};
                const futures = {wins: 0, losses: 0};
                const challengers = {wins: 0, losses: 0};
                const total = {wins: 0, losses: 0};
                for (const year in stat) {
                    const levelByYear = stat[year].levelFinals;
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
                }
                return {
                    maintourWin: mainTours.wins,
                    maintourLose: mainTours.losses,
                    finalsWin: tourFinals.wins,
                    finalsLose: tourFinals.losses,
                    masterWin: master.wins,
                    masterLose: master.losses,
                    slamWin: grandSlam.wins,
                    slamLose: grandSlam.losses,
                    cupsWin: cups.wins,
                    cupsLose: cups.losses,
                    futuresWin: futures.wins,
                    futuresLose: futures.losses,
                    challengersWin: challengers.wins,
                    challengersLose: challengers.losses,
                    totalWins: total.wins,
                    totalLose: total.losses,
                };
            });
        return response
    }

    private getPlayerByName(
        name: string,
        playerRepository: Repository<PlayerAtp> | Repository<PlayerWta>,
    ) {
        return playerRepository
            .createQueryBuilder('player')
            .leftJoin('player.information', 'info')
            .leftJoinAndSelect('player.country', 'country')
            .select([
                'player.id',
                'player.name',
                'player.birthday',
                'player.currentRank',
                'info.plays',
                'country.name',
                'country.acronym',
            ])
            .where('player.name = :requestName', {requestName: name})
            .getOne()
            .then((player) => {
                if (!player) {
                    throw new NotFoundException('No such player');
                }
                return player;
            });
    }

    private getSurfaceDataForTwo(
        player1Id: number,
        player2Id: number,
        gameRepo: Repository<GameAtp> | Repository<GameWta>,
    ) {
        return gameRepo
            .createQueryBuilder('game')
            .leftJoinAndSelect('game.tournament', 'tournament')
            .leftJoinAndSelect('tournament.court', 'court')
            .where(
                '(game.player1 = :player1Id and game.player2 = :player2Id or game.player1 = :player2Id and game.player2 = :player1Id)',
                {
                    player1Id,
                    player2Id,
                },
            )
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
            .getMany()
            .then((games) => {
                const result = {
                    hard1: 0,
                    iHard1: 0,
                    clay1: 0,
                    grass1: 0,
                    hard2: 0,
                    iHard2: 0,
                    clay2: 0,
                    grass2: 0,
                    total1: 0,
                    total2: 0,
                };
                games
                    .map((game) => {
                        return this.getCourtStat(
                            game.tournament.court.id,
                            player1Id === game.player1Id,
                        );
                    })
                    .forEach((stat) => {
                        result.hard1 += stat.hard1;
                        result.clay1 += stat.clay1;
                        result.iHard1 += stat.iHard1;
                        result.grass1 += stat.grass1;
                        result.hard2 += stat.hard2;
                        result.clay2 += stat.clay2;
                        result.iHard2 += stat.iHard2;
                        result.grass2 += stat.grass2;
                        result.total1 =
                            result.grass1 +
                            result.hard1 +
                            result.clay1 +
                            result.iHard1;
                        result.total2 =
                            result.grass2 +
                            result.hard2 +
                            result.clay2 +
                            result.iHard2;
                    });
                return result;
            });
    }

    private async getMatchesData(
        player1Id: number,
        gameRepo: Repository<GameAtp> | Repository<GameWta>,
        query: MatchPlayedGameDto,
    ) {
        let result = gameRepo
            .createQueryBuilder('game')
            .leftJoinAndSelect('game.tournament', 'tournament')
            .leftJoinAndSelect('tournament.court', 'court')
            .where('(game.player1 = :player1Id or game.player2 = :player1Id)', {
                player1Id,
            })
            .andWhere('tournament.rankId != 0')
            .andWhere('tournament.rankId != 1')
            .andWhere('tournament.rankId != 6')
            .andWhere('game.roundId != 0')
            .andWhere('game.roundId != 1')
            .andWhere('game.roundId != 2')
            .andWhere('game.roundId != 3')
            .andWhere('game.result is not null')
            .andWhere('game.date is not null')
            .andWhere("game.result != 'w/o'")
            .andWhere("game.result != 'bye'")
            .andWhere("game.result != ''")
            .andWhere("game.result != 'ret.'")
            .orderBy('tournament.date', 'DESC');

        if (query?.court) {
            result = result.andWhere('LOWER(court.name) in (:...courtFilter)', {
                courtFilter: query.court.split(',').map((name) => name.toLowerCase()),
            });
        }
        if (query?.round) {
            result = result
                .leftJoin('game.round', 'round')
                .andWhere('LOWER(round.name) = LOWER(:roundFilter)', {
                    roundFilter: query.round,
                });
        }
        if (query?.tournament) {
            result = result.andWhere('tournament.name = :tourName', {
                tourName: query.tournament,
            });
        }
        if (query?.year) {
            result = result.andWhere(`tournament.date BETWEEN :year and :nextYear`, {
                year: `${query.year}-01-01`,
                nextYear: `${query.year}-12-31`,
            });
        }

        let res = {
            slam1: 0,
            slam2: 0,
            title1: 0,
            title2: 0,
            master1: 0,
            master2: 0,
            main1: 0,
            main2: 0,
            cup1: 0,
            cup2: 0,
            future1: 0,
            future2: 0,
            challengers1: 0,
            challengers2: 0,
            tourFinals1: 0,
            tourFinals2: 0,
        };

        return await result
            .orderBy('game.date', 'DESC')
            .getMany()
            .then((games) => {
                games.forEach(game => {
                    if ([0, 1, 2, 3].indexOf(game.roundId) == -1 && game.tournament.rankId == 2) {
                        player1Id == game.player1Id ? res.main1++ : res.main2++;
                    }
                    if ([0, 1, 2, 3].indexOf(game.roundId) == -1 && game.tournament.rankId == 4) {
                        player1Id == game.player1Id ? res.slam1++ : res.slam2++;
                    }
                    if ([0, 1, 2, 3].indexOf(game.roundId) == -1 && game.tournament.rankId == 5) {
                        player1Id == game.player1Id ? res.cup1++ : res.cup2++;
                    }
                    if ([0, 1, 2, 3].indexOf(game.roundId) == -1 && game.tournament.rankId == 0) {
                        player1Id == game.player1Id ? res.future1++ : res.future2++;
                    }
                    if ([0, 1, 2, 3].indexOf(game.roundId) == -1 && game.tournament.rankId == 1) {
                        player1Id == game.player1Id ? res.challengers1++ : res.challengers2++;
                    }
                    if ([2, 3, 4, 7, 8, 9].indexOf(game.tournament.rankId) > -1 && game.roundId == 12) {
                        player1Id == game.player1Id ? res.title1++ : res.title2++;
                    }
                    if ([0, 1, 2, 3].indexOf(game.roundId) == -1 && game.tournament.rankId == 3) {
                        player1Id == game.player1Id ? res.master1++ : res.master2++;
                    }
                    if ([0, 1, 2, 3].indexOf(game.roundId) == -1 && game.tournament.rankId == 7) {
                        player1Id == game.player1Id ? res.tourFinals1++ : res.tourFinals2++;
                    }
                })
                return res;
            });
    }

    private getSurfaceData(
        player1Id: number,
        gameRepo: Repository<GameAtp> | Repository<GameWta>,
        query: MatchPlayedGameDto,
    ) {
        let result = gameRepo
            .createQueryBuilder('game')
            .leftJoinAndSelect('game.tournament', 'tournament')
            .leftJoinAndSelect('tournament.court', 'court')
            .where('(game.player1 = :player1Id or game.player2 = :player1Id)', {
                player1Id,
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

        if (query?.court) {
            result = result.andWhere('LOWER(court.name) in (:...courtFilter)', {
                courtFilter: query.court.split(',').map((name) => name.toLowerCase()),
            });
        }
        if (query?.round) {
            result = result
                .leftJoin('game.round', 'round')
                .andWhere('LOWER(round.name) = LOWER(:roundFilter)', {
                    roundFilter: query.round,
                });
        }
        if (query?.tournament) {
            result = result.andWhere('tournament.name = :tourName', {
                tourName: query.tournament,
            });
        }
        if (query?.year) {
            result = result.andWhere(`tournament.date BETWEEN :year and :nextYear`, {
                year: `${query.year}-01-01`,
                nextYear: `${query.year}-12-31`,
            });
        }

        return result
            .orderBy('game.date', 'DESC')
            .getMany()
            .then((games) => {
                const result = {
                    hard1: 0,
                    iHard1: 0,
                    clay1: 0,
                    grass1: 0,
                    hard2: 0,
                    iHard2: 0,
                    clay2: 0,
                    grass2: 0,
                    total1: 0,
                    total2: 0,
                };
                games
                    .map((game) => {
                        return this.getCourtStat(
                            game.tournament.court.id,
                            player1Id === game.player1Id,
                        );
                    })
                    .forEach((stat) => {
                        result.hard1 += stat.hard1;
                        result.clay1 += stat.clay1;
                        result.iHard1 += stat.iHard1;
                        result.grass1 += stat.grass1;
                        result.hard2 += stat.hard2;
                        result.clay2 += stat.clay2;
                        result.iHard2 += stat.iHard2;
                        result.grass2 += stat.grass2;
                    });
                result.total1 =
                    result.total1 +
                    result.grass1 +
                    result.hard1 +
                    result.clay1 +
                    result.iHard1;
                result.total2 =
                    result.total2 +
                    result.grass2 +
                    result.hard2 +
                    result.clay2 +
                    result.iHard2;
                return result;
            });
    }

    private bestRank(
        id: number,
        ratingRepository: Repository<RatingAtp> | Repository<RatingWta>,
    ) {
        return ratingRepository
            .createQueryBuilder('rating')
            .where('rating.player = :playerId', {playerId: id})
            .orderBy('rating.position')
            .getOne()
            .then((rating) => rating?.position);
    }

    private currentRank(
        id: number,
        ratingRepository: Repository<RatingAtp> | Repository<RatingWta>,
    ) {
        return ratingRepository
            .createQueryBuilder('rating')
            .where('rating.player = :playerId', {playerId: id})
            .orderBy('rating.date', 'DESC')
            .limit()
            .getOne()
            .then((rating) => rating?.position);
    }

    private getYtdTitles(
        playerId: number,
        gameRepo: Repository<GameAtp> | Repository<GameWta>,
        allTime: boolean = false
    ) {
        let year: number = 1980
        if (allTime == false) {
            year = new Date().getFullYear();
        }
        let currentYear = new Date().getFullYear();
        return gameRepo
            .createQueryBuilder('game')
            .where('game.roundId = 12')
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
            .andWhere('tournament.rankId != 0')
            .andWhere('tournament.rankId != 1')
            .andWhere('tournament.rankId != 6')
            .andWhere('game.roundId != 0')
            .andWhere('game.roundId != 1')
            .andWhere('game.roundId != 2')
            .andWhere('game.roundId != 3')
            .andWhere('game.result is not null')
            .andWhere('game.date is not null')
            .andWhere("game.result != 'w/o'")
            .andWhere("game.result != 'bye'")
            .andWhere("game.result != ''")
            .getCount();
    }

    private getYTDWL(
        playerId: number,
        gameRepo: Repository<GameAtp> | Repository<GameWta>,
        query?: MatchPlayedGameDto,
    ) {
        let result = gameRepo
            .createQueryBuilder('game')
            .leftJoin('game.tournament', 'tour')
            .where('(game.player1 = :playerId or game.player2 = :playerId)', {
                playerId,
            })
            .andWhere('tour.rankId != 0')
            .andWhere('tour.rankId != 1')
            .andWhere('tour.rankId != 6')
            .andWhere('game.roundId != 0')
            .andWhere('game.roundId != 1')
            .andWhere('game.roundId != 2')
            .andWhere('game.roundId != 3')
            .andWhere('game.result is not null')
            .andWhere('game.date is not null')
            .andWhere("game.result != 'w/o'")
            .andWhere("game.result != 'bye'")
            .andWhere("game.result != ''");

        if (query?.court) {
            result = result
                .leftJoin('tour.court', 'court')
                .andWhere('LOWER(court.name) in (:...courtFilter)', {
                    courtFilter: query.court.split(',').map((name) => name.toLowerCase()),
                });
        }
        if (query?.round) {
            result = result
                .leftJoin('game.round', 'round')
                .andWhere('LOWER(round.name) = LOWER(:roundFilter)', {
                    roundFilter: query.round,
                });
        }
        if (query?.tournament) {
            result = result.andWhere('tour.name = :tourName', {
                tourName: query.tournament,
            });
        }
        if (query?.year) {
            result = result.andWhere(`tour.date BETWEEN :year and :nextYear`, {
                year: `${query.year}-01-01`,
                nextYear: `${query.year}-12-31`,
            });
        }
        if (query === undefined) {
            const date = new Date();
            let year = date.getFullYear();
            result = result.andWhere(`tour.date BETWEEN :year and :nextYear`, {
                year: `${year}-01-01`,
                nextYear: `${year}-12-31`,
            });
        }

        return result.getMany().then((games) => {
            let result = {
                win: 0,
                lose: 0,
            };
            games.forEach((game) => {
                game.player1Id == playerId ? result.win++ : result.lose++
            });
            return {
                ytdWon: result.win,
                ytdLost: result.lose,
            };
        });
    }

    private getCareerWL(
        playerId: number,
        gameRepo: Repository<GameAtp> | Repository<GameWta>,
    ) {
        return gameRepo
            .createQueryBuilder('game')
            .leftJoinAndSelect('game.tournament', 'tournament')
            .where('(game.player1 = :playerId or game.player2 = :playerId)', {
                playerId,
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
            .getMany()
            .then((games) => {
                const result = {
                    careerWin: 0,
                    careerLose: 0,
                };
                games.forEach((game) =>
                    game.player1Id == playerId ? result.careerWin++ : result.careerLose++,
                );
                return result;
            });
    }

    private careerMoney(
        playerId: number,
        gameRepository: Repository<GameAtp> | Repository<GameWta>,
        type: string,
    ) {
        // TODO: проверить логику для неполных турниров
        // TODO: проверить наличие даблов
        // TODO: доллары и евро ???
        return gameRepository
            .createQueryBuilder('game')
            .select([
                'game.id',
                'game.roundId',
                'game.player1Id',
                'game.player2Id',
                'winner.name',
                'winner.id',
                'winner.countryAcr',
                'loser.name',
                'loser.id',
                'loser.countryAcr',
                'tournament.id',
                'tournament.singlesPrize',
            ])
            .where('(game.player1 = :playerId or game.player2 = :playerId)', {
                playerId,
            })
            .leftJoin('game.tournament', 'tournament')
            .leftJoin('game.player1', 'winner')
            .leftJoin('game.player2', 'loser')
            .leftJoinAndSelect('tournament.singlesPrize', 'singlesPrize')
            .andWhere('tournament.singlesPrizeId is not null')
            .andWhere("winner.name not like '%/%'")
            .getMany()
            .then((games) => {
                const playerTournamentIds = new Set();
                for (const game of games) {
                    playerTournamentIds.add(game.tournament.id);
                }
                const playerTournamentsById: { [key: string]: any } = {};
                const gamesByTournamentId: { [key: string]: any[] } = {};
                const bestRoundByTournamentId: { [key: string]: any } = {};
                const moneyByTournamentId: { [key: string]: any } = {};
                for (const tournamentId of playerTournamentIds) {
                    if (!gamesByTournamentId[tournamentId.toString()]) {
                        gamesByTournamentId[tournamentId.toString()] = [];
                    }
                    for (const game of games) {
                        if (
                            !playerTournamentsById[tournamentId.toString()] &&
                            game.tournament.id == tournamentId
                        ) {
                            playerTournamentsById[tournamentId.toString()] = game.tournament;
                        }
                        if (game.tournament.id == tournamentId) {
                            gamesByTournamentId[tournamentId.toString()].push(game);
                        }
                    }

                    for (const game of gamesByTournamentId[tournamentId.toString()]) {
                        if (game.player1Id == playerId) {
                            const bestRound =
                                bestRoundByTournamentId[tournamentId.toString()] || 0;
                            bestRoundByTournamentId[tournamentId.toString()] =
                                game.roundId > bestRound ? game.roundId : bestRound;
                        }
                    }
                    moneyByTournamentId[tournamentId.toString()] =
                        playerTournamentsById[tournamentId.toString()].singlesPrize[
                            this.roundIdToName(
                                bestRoundByTournamentId[tournamentId.toString()],
                            )
                            ];
                }

                let playerSum = 0;
                for (const moneyKey of Object.keys(moneyByTournamentId)) {
                    if (moneyByTournamentId[moneyKey])
                        playerSum +=
                            moneyByTournamentId[moneyKey] > 0
                                ? moneyByTournamentId[moneyKey]
                                : 0;
                }

                return playerSum;
            });
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

    private async getLevelBreakdown(
        playerId: number,
        playerStatRepo: Repository<PlayerStatAtp> | Repository<PlayerStatWta>,
        year: string
    ) {

        let res = await playerStatRepo
            .createQueryBuilder('stat')
            .where('stat.player = :playerId', {playerId: playerId})
            .getOne()
            .then((stat) => {
                let result: any[] = []
                if (stat != undefined) {
                    result = JSON.parse(stat.data);

                    result['career'] = Object.values(result).reduce((prev, actual) => {
                        const wlResult = (key) => {
                            return Object.values({
                                ...Object.keys(actual[key]).map((objKey) => {
                                    const obj = {};
                                    obj[objKey] = {
                                        w:
                                            (prev[key][objKey]?.w ?? 0) + (actual[key][objKey]?.w ?? 0),
                                        l:
                                            (prev[key][objKey]?.l ?? 0) + (actual[key][objKey]?.l ?? 0),
                                    };
                                    return obj;
                                }),
                            }).reduce((prev, current) => ({
                                ...prev,
                                ...current,
                            }));
                        };

                        const level = wlResult('level');

                        const temp = {
                            level: {
                                ...prev['level'],
                                ...level,
                            },
                        };

                        return temp;
                    });
                }
                return result;
            });
        console.log(res)
        if (year == undefined || year == null || year == '') {
            return res['career']
        } else {
            return res[year]
        }
    }

}
