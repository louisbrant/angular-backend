import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { PlayerAtp, PlayerWta } from 'src/modules/player/entity/player.entity';
import {
  TournamentAtp,
  TournamentWta,
} from 'src/modules/tournament/entity/tournament.entity';
import { Round } from 'src/modules/round/entity/round.entity';

class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne((type) => Round)
  @JoinColumn()
  round: Round;

  @Column()
  roundId: number;

  @Column()
  result: string;

  @Column('timestamp without time zone', { nullable: true })
  date: Date;

  @Column({ nullable: true })
  seed1: string;

  @Column({ nullable: true })
  seed2: string;

  @Column({ nullable: true })
  odd1: string;

  @Column({ nullable: true })
  odd2: string;

  @Column()
  player1Id: number;

  @Column()
  player2Id: number;

  @Column()
  tournamentId: number;

  @Column({ nullable: true })
  draw: number;
}

@Entity()
@Unique(['player1Id', 'player2Id', 'tournamentId', 'roundId'])
export class GameAtp extends Game {
  @ManyToOne((type) => TournamentAtp, (tournament) => tournament.games)
  @JoinColumn()
  tournament: TournamentAtp;

  @ManyToOne((type) => PlayerAtp, (player) => player.gamesWinner)
  @JoinColumn()
  player1: PlayerAtp;

  @ManyToOne((type) => PlayerAtp, (player) => player.gamesLoser)
  @JoinColumn()
  player2: PlayerAtp;

  @ManyToOne((type) => PlayerAtp, (player) => player.games)
  @JoinColumn()
  players: PlayerAtp;
}

@Entity()
@Unique(['player1Id', 'player2Id', 'tournamentId', 'roundId'])
export class GameWta extends Game {
  @ManyToOne((type) => TournamentWta, (tournament) => tournament.games)
  @JoinColumn()
  tournament: TournamentWta;

  @ManyToOne((type) => PlayerWta, (player) => player.gamesWinner)
  @JoinColumn()
  player1: PlayerWta;

  @ManyToOne((type) => PlayerWta, (player) => player.gamesLoser)
  @JoinColumn()
  player2: PlayerWta;

  @ManyToOne((type) => PlayerWta, (player) => player.games)
  @JoinColumn()
  players: PlayerWta;
}
