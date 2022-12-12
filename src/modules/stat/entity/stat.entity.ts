import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { PlayerAtp, PlayerWta } from 'src/modules/player/entity/player.entity';
import {
  TournamentAtp,
  TournamentWta,
} from 'src/modules/tournament/entity/tournament.entity';

class Stat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  round: number;

  @Column({ nullable: true })
  firstServe1: number;

  @Column({ nullable: true })
  firstServeOf1: number;

  @Column({ nullable: true })
  aces1: number;

  @Column({ nullable: true })
  doubleFaults1: number;

  @Column({ nullable: true })
  unforcedErrors1: number;

  @Column({ nullable: true })
  winningOnFirstServe1: number;

  @Column({ nullable: true })
  winningOnFirstServeOf1: number;

  @Column({ nullable: true })
  winningOnSecondServe1: number;

  @Column({ nullable: true })
  winningOnSecondServeOf1: number;

  @Column({ nullable: true })
  winners1: number;

  @Column({ nullable: true })
  breakPointsConverted1: number;

  @Column({ nullable: true })
  breakPointsConvertedOf1: number;

  @Column({ nullable: true })
  netApproaches1: number;

  @Column({ nullable: true })
  netApproachesOf1: number;

  @Column({ nullable: true })
  totalPointsWon1: number;

  @Column({ nullable: true })
  fastestServe1: number;

  @Column({ nullable: true })
  averageFirstServeSpeed1: number;

  @Column({ nullable: true })
  averageSecondServeSpeed1: number;

  @Column({ nullable: true })
  firstServe2: number;

  @Column({ nullable: true })
  firstServeOf2: number;

  @Column({ nullable: true })
  aces2: number;

  @Column({ nullable: true })
  doubleFaults2: number;

  @Column({ nullable: true })
  unforcedErrors2: number;

  @Column({ nullable: true })
  winningOnFirstServe2: number;

  @Column({ nullable: true })
  winningOnFirstServeOf2: number;

  @Column({ nullable: true })
  winningOnSecondServe2: number;

  @Column({ nullable: true })
  winningOnSecondServeOf2: number;

  @Column({ nullable: true })
  winners2: number;

  @Column({ nullable: true })
  breakPointsConverted2: number;

  @Column({ nullable: true })
  breakPointsConvertedOf2: number;

  @Column({ nullable: true })
  netApproaches2: number;

  @Column({ nullable: true })
  netApproachesOf2: number;

  @Column({ nullable: true })
  totalPointsWon2: number;

  @Column({ nullable: true })
  fastestServe2: number;

  @Column({ nullable: true })
  averageFirstServeSpeed2: number;

  @Column({ nullable: true })
  averageSecondServeSpeed2: number;

  @Column({ nullable: true })
  rpw1: number;

  @Column({ nullable: true })
  rpwOf1: number;

  @Column({ nullable: true })
  rpw2: number;

  @Column({ nullable: true })
  rpwOf2: number;

  @Column({ nullable: true })
  mt: string;

  @Column()
  tournamentId: number;

  @Column()
  player1Id: number;

  @Column()
  player2Id: number;
}

@Entity()
@Unique(['player1Id', 'player2Id', 'tournamentId', 'round'])
export class StatAtp extends Stat {
  @ManyToOne((type) => PlayerAtp, (player) => player.statsWinner)
  @JoinColumn()
  player1: PlayerAtp;

  @ManyToOne((type) => PlayerAtp, (player) => player.statsLoser)
  @JoinColumn()
  player2: PlayerAtp;

  @ManyToOne((type) => TournamentAtp)
  @JoinColumn()
  tournament: TournamentAtp;
}

@Entity()
@Unique(['player1Id', 'player2Id', 'tournamentId', 'round'])
export class StatWta extends Stat {
  @ManyToOne((type) => PlayerWta, (player) => player.statsWinner)
  @JoinColumn()
  player1: PlayerWta;

  @ManyToOne((type) => PlayerWta, (player) => player.statsLoser)
  @JoinColumn()
  player2: PlayerWta;

  @ManyToOne((type) => TournamentWta)
  @JoinColumn()
  tournament: TournamentWta;
}
