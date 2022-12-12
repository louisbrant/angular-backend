import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { GameAtp, GameWta } from 'src/modules/game/entity/game.entity';
import { Country } from 'src/modules/country/entity/country.entity';
import { Rank } from 'src/modules/rank/entity/rank.entity';
import { PointPrize } from 'src/modules/points/entity/prize.entity';
import { Court } from 'src/modules/court/entity/court.entity';

class Tournament {
  @PrimaryColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne((type) => Court, (court) => court.tournaments)
  @JoinColumn()
  court: Court;

  @Column()
  courtId: number;

  @Column('timestamp with time zone', { nullable: true })
  date: Date;

  @ManyToOne(() => Rank)
  @JoinColumn()
  rank: Rank;

  @Column()
  rankId: number;

  @Column({ nullable: true })
  link: number;

  @ManyToOne((type) => Country)
  @JoinColumn()
  country: Country;

  @Column({ name: 'countryAcronym' })
  countryAcr: string;

  @Column({ nullable: true })
  prize: string;

  @ManyToOne((type) => PointPrize)
  @JoinColumn()
  rating: PointPrize;

  @Column({ nullable: true })
  ratingId: number;

  @Column({ nullable: true })
  url: string;

  @Column('double precision', { nullable: true })
  latitude: number;

  @Column('double precision', { nullable: true })
  longitude: number;

  @Column({ nullable: true })
  site: string;

  @Column({ nullable: true })
  race: number;

  @Column({ nullable: true })
  entry: number;

  @ManyToOne((type) => PointPrize)
  @JoinColumn()
  singlesPrize: PointPrize;

  @Column({ nullable: true })
  singlesPrizeId: number;

  @ManyToOne((type) => PointPrize)
  @JoinColumn()
  doublesMoney: PointPrize;

  @Column({ nullable: true })
  doublesMoneyId: number;

  @Column({ nullable: true })
  tier: string;

  @Column({ nullable: true })
  reserveInt: number;

  @Column({ nullable: true })
  reserveChar: string;

  @Column({ nullable: true })
  live: string;

  @Column({ nullable: true })
  result: string;
}

@Entity()
export class TournamentAtp extends Tournament {
  @OneToMany((type) => GameAtp, (game) => game.tournament)
  games: GameAtp[];
}

@Entity()
export class TournamentWta extends Tournament {
  @OneToMany((type) => GameWta, (game) => game.tournament)
  games: GameWta[];
}
