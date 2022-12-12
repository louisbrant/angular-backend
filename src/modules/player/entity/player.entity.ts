import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryColumn } from 'typeorm';
import { GameAtp, GameWta } from 'src/modules/game/entity/game.entity';
import { StatAtp, StatWta } from 'src/modules/stat/entity/stat.entity';
import { EpAtp, EpWta } from 'src/modules/ep/entity/ep.entity';
import { Country } from 'src/modules/country/entity/country.entity';
import { RatingAtp, RatingWta } from 'src/modules/ratings/entity/rating.entity';

class Player {
  @PrimaryColumn()
  id: number;

  @Column()
  name: string;

  @Column('timestamp without time zone', { nullable: true })
  birthday: Date;

  @ManyToOne((type) => Country, { nullable: true })
  @JoinColumn()
  country: Country;

  @Column({ name: 'countryAcronym', nullable: true })
  countryAcr: string;

  @Column({ nullable: true })
  currentRank: number;

  @Column({ nullable: true })
  progress: number;

  @Column({ nullable: true })
  points: number;

  @Column({ nullable: true })
  hardPoints: number;

  @Column({ nullable: true })
  hardTournament: number;

  @Column({ nullable: true })
  clayPoints: number;

  @Column({ nullable: true })
  clayTournament: number;

  @Column({ nullable: true })
  grassPoints: number;

  @Column({ nullable: true })
  grassTournament: number;

  @Column({ nullable: true })
  carpetPoints: number;

  @Column({ nullable: true })
  carterTournament: number;

  @Column({ nullable: true })
  prize: number;

  @Column({ nullable: true })
  ch: number;

  @Column({ nullable: true })
  doublesPosition: number;

  @Column({ nullable: true })
  doublesProgress: number;

  @Column({ nullable: true })
  doublesPoints: number;

  @Column({ nullable: true })
  ihardPoints: number;

  @Column({ nullable: true })
  ihardTournament: number;

  @Column({ nullable: true })
  itf: number;
}

@Entity()
export class PlayerAtp extends Player {
  @OneToMany((type) => RatingAtp, (rating) => rating.player)
  rating: RatingAtp[];

  @OneToMany((type) => GameAtp, (game) => game.player1)
  gamesWinner: GameAtp[];

  @OneToMany((type) => GameAtp, (game) => game.player2)
  gamesLoser: GameAtp[];

  @OneToMany((type) => GameAtp, (game) => game.players)
  games: GameAtp[];

  @OneToMany((type) => StatAtp, (stat) => stat.player1)
  statsWinner: StatAtp[];

  @OneToMany((type) => StatAtp, (stat) => stat.player2)
  statsLoser: StatAtp[];

  @OneToMany((type) => EpAtp, (ep) => ep.player)
  information: EpAtp[];
}

@Entity()
export class PlayerWta extends Player {
  @OneToMany((type) => RatingWta, (rating) => rating.player)
  rating: RatingWta[];

  @OneToMany((type) => GameWta, (game) => game.player1)
  gamesWinner: GameWta[];

  @OneToMany((type) => GameWta, (game) => game.player2)
  gamesLoser: GameWta[];

  @OneToMany((type) => GameWta, (game) => game.players)
  games: GameWta[];

  @OneToMany((type) => StatWta, (stat) => stat.player1)
  statsWinner: StatWta[];

  @OneToMany((type) => StatWta, (stat) => stat.player2)
  statsLoser: StatWta[];

  @OneToMany((type) => EpWta, (ep) => ep.player)
  information: EpWta[];
}
