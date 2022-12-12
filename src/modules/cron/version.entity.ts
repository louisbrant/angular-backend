import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Version {
  @PrimaryColumn()
  ver: string;

  @Column()
  dat: string;

  @Column()
  atp: string;

  @Column()
  wta: string;

  @Column()
  inProgress: number;
}
