import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { PlayerAtp, PlayerWta } from 'src/modules/player/entity/player.entity';

class PlayerStat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('jsonb')
  data: string;

  @Column()
  playerId: number;
}

@Entity()
@Unique(['playerId'])
export class PlayerStatAtp extends PlayerStat {
  @ManyToOne((type) => PlayerAtp)
  @JoinColumn()
  player: PlayerAtp;
}

@Entity()
@Unique(['playerId'])
export class PlayerStatWta extends PlayerStat {
  @ManyToOne((type) => PlayerWta)
  @JoinColumn()
  player: PlayerWta;
}
