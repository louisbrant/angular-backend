import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { PlayerAtp, PlayerWta } from 'src/modules/player/entity/player.entity';

class Rating {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('timestamp with time zone')
  date: Date;

  @Column()
  point: number;

  @Column()
  position: number;
}

@Entity()
@Unique(['date', 'player'])
export class RatingAtp extends Rating {
  @ManyToOne((type) => PlayerAtp)
  @JoinColumn()
  player: PlayerAtp;
}

@Entity()
@Unique(['date', 'player'])
export class RatingWta extends Rating {
  @ManyToOne((type) => PlayerWta)
  @JoinColumn()
  player: PlayerWta;
}
