import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'point' })
export class PointPrize {
  @PrimaryColumn()
  id: number;

  @Column()
  winner: number;

  @Column()
  finalist: number;

  @Column({ nullable: true })
  semiFinalist: number;

  @Column({ nullable: true })
  quarterFinalist: number;

  @Column({ nullable: true })
  fourth: number;

  @Column({ nullable: true })
  third: number;

  @Column({ nullable: true })
  second: number;

  @Column({ nullable: true })
  first: number;

  @Column({ nullable: true })
  qualifying: number;

  @Column({ nullable: true })
  qualifyingSecond: number;

  @Column({ nullable: true })
  qualifyingFirst: number;

  @Column({ nullable: true })
  preQualifying: number;
}
