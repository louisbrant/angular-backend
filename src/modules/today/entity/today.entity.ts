import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { PlayerAtp, PlayerWta } from 'src/modules/player/entity/player.entity';
import {
  TournamentAtp,
  TournamentWta,
} from 'src/modules/tournament/entity/tournament.entity';
import { Round } from 'src/modules/round/entity/round.entity';

class Today {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('timestamp without time zone', { nullable: true })
  date: Date;

  @ManyToOne((type) => Round)
  @JoinColumn()
  round: Round;

  @Column()
  roundId: number;

  @Column()
  draw: number;

  @Column({ nullable: true })
  result: string;

  @Column({ nullable: true })
  complete: number;

  @Column({ nullable: true })
  live: string;

  @Column('timestamp without time zone', { nullable: true })
  timeGame: Date;

  @Column({ nullable: true })
  reserveInt: number;

  @Column({ nullable: true })
  reserveString: string;

  @Column({ nullable: true })
  odd1: string;

  @Column({ nullable: true })
  odd2: string;

  @Column({ nullable: true })
  seed1: string;

  @Column({ nullable: true })
  seed2: string;

  @Column()
  player1Id: number;

  @Column()
  player2Id: number;

  @Column()
  tournamentId: number;
}

@Entity()
@Unique(['tournamentId', 'player1Id', 'player2Id', 'roundId'])
export class TodayAtp extends Today {
  @ManyToOne((type) => PlayerAtp)
  @JoinColumn()
  player1: PlayerAtp;

  @ManyToOne((type) => PlayerAtp)
  @JoinColumn()
  player2: PlayerAtp;

  @ManyToOne((type) => TournamentAtp)
  @JoinColumn()
  tournament: TournamentAtp;
}

@Entity()
@Unique(['tournamentId', 'player1Id', 'player2Id', 'roundId'])
export class TodayWta extends Today {
  @ManyToOne((type) => PlayerWta)
  @JoinColumn()
  player1: PlayerWta;

  @ManyToOne((type) => PlayerWta)
  @JoinColumn()
  player2: PlayerWta;

  @ManyToOne((type) => TournamentWta)
  @JoinColumn()
  tournament: TournamentWta;
}
