import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Rank {
  @PrimaryColumn()
  id: number;

  @Column()
  name: string;
}
