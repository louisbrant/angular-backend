import { Injectable } from '@nestjs/common';
import { CreateGameDto } from 'src/modules/game/dto/create-game.dto';
import { UpdateGameDto } from 'src/modules/game/dto/update-game.dto';
import { GameAtp, GameWta } from 'src/modules/game/entity/game.entity';
import { SharedService } from 'src/services/shared.service';

@Injectable()
export class GameService {
  constructor(private sharedService: SharedService) {}

  create(createGameDto: CreateGameDto) {
    return 'This action adds a new game';
  }

  findAll() {
    return `This action returns all game`;
  }

  findOne(id: number) {
    return `This action returns a #${id} game`;
  }

  update(id: number, updateGameDto: UpdateGameDto) {
    return `This action updates a #${id} game`;
  }

  remove(id: number) {
    return `This action removes a #${id} game`;
  }

  public mapGameStats(type: string, game: GameAtp | GameWta | any) {
    const player1Stats = {
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
    };
    const player2Stats = {
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
    };
    return {
      player1: {
        ...game.player1,
        seed: game.seed1,
        odd: game.odd1,
        image: this.sharedService.getPlayerImage(type, game.player1.id),
        stats: this.isEmptyObject(player1Stats) ? player1Stats : null,
      },
      player2: {
        ...game.player2,
        seed: game.seed2,
        odd: game.odd2,
        image: this.sharedService.getPlayerImage(type, game.player2.id),
        stats: this.isEmptyObject(player2Stats) ? player2Stats : null,
      },
    };
  }

  private isEmptyObject(object) {
    return Object.keys(object).filter((key) => object[key]).length > 0
  }

}
