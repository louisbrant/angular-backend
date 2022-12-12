import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Round {
  @PrimaryColumn()
  id: number;

  @Column()
  name: string;
}
