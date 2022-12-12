import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Country {
  @Column()
  name: string;

  @PrimaryColumn()
  acronym: string;
}
