import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { TournamentAtp } from 'src/modules/tournament/entity/tournament.entity';

@Entity()
export class Court {
  @PrimaryColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany((type) => TournamentAtp, (tournament) => tournament.court)
  tournaments: TournamentAtp[];
}
