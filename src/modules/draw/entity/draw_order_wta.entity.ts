import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique} from "typeorm";
import {Round} from "../../round/entity/round.entity";
import {PlayerWta} from "../../player/entity/player.entity";
import {TournamentWta} from "../../tournament/entity/tournament.entity";

@Entity()
export class DrawOrderWta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  draw: number;

  @Column('timestamp without time zone', { nullable: true })
  date: Date;

  @ManyToOne((type) => Round)
  @JoinColumn()
  round: Round;
  @Column()
  roundId: number;

  @ManyToOne((type) => PlayerWta)
  @JoinColumn()
  player1: PlayerWta;
  @Column()
  player1Id: number;

  @ManyToOne((type) => PlayerWta,)
  @JoinColumn()
  player2: PlayerWta;
  @Column()
  player2Id: number;

  @ManyToOne((type) => TournamentWta)
  @JoinColumn()
  tournament: TournamentWta;
  @Column()
  tournamentId: number;

}
