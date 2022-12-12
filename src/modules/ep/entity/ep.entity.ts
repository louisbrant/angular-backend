import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { PlayerAtp, PlayerWta } from 'src/modules/player/entity/player.entity';

class Ep {
  @PrimaryColumn()
  id: number;

  @Column()
  turnedPro: string;

  @Column()
  weight: string;

  @Column()
  height: string;

  @Column()
  birthplace: string;

  @Column()
  residence: string;

  @Column()
  plays: string;

  @Column()
  coach: string;

  @Column()
  site: string;

  @Column()
  twitter: string;

  @Column()
  page: string;

  @Column()
  instagram: string;

  @Column()
  facebook: string;

  @Column()
  last_revised: string;

  @Column({ default: 'Active' })
  playerStatus: string;
}

@Entity()
export class EpAtp extends Ep {
  @ManyToOne((type) => PlayerAtp, (player) => player.id)
  @JoinColumn({ name: 'id' })
  player: PlayerAtp;
}

@Entity()
export class EpWta extends Ep {
  @ManyToOne((type) => PlayerWta, (player) => player.id)
  @JoinColumn({ name: 'id' })
  player: PlayerWta;
}
