import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { PlayerAtp, PlayerWta } from 'src/modules/player/entity/player.entity';

class H2h {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  player1Wins: number;

  @Column()
  player2Wins: number;

  @Column()
  player1Id: number;

  @Column()
  player2Id: number;
}

@Entity()
@Unique(['player1Id', 'player2Id'])
export class H2hAtp extends H2h {
  @ManyToOne((type) => PlayerAtp)
  @JoinColumn()
  player1: PlayerAtp;

  @ManyToOne((type) => PlayerAtp)
  @JoinColumn()
  player2: PlayerAtp;
}

@Entity()
@Unique(['player1Id', 'player2Id'])
export class H2hWta extends H2h {
  @ManyToOne((type) => PlayerWta)
  @JoinColumn()
  player1: PlayerWta;

  @ManyToOne((type) => PlayerWta)
  @JoinColumn()
  player2: PlayerWta;
}
