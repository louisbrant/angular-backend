import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique} from "typeorm";
import {Round} from "../../round/entity/round.entity";
import {PlayerAtp} from "../../player/entity/player.entity";
import {TournamentAtp} from "../../tournament/entity/tournament.entity";

@Entity()
export class DrawOrderAtp {
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

  @ManyToOne((type) => PlayerAtp)
  @JoinColumn()
  player1: PlayerAtp;
  @Column()
  player1Id: number;

  @ManyToOne((type) => PlayerAtp)
  @JoinColumn()
  player2: PlayerAtp;
  @Column()
  player2Id: number;

  @ManyToOne((type) => TournamentAtp)
  @JoinColumn()
  tournament: TournamentAtp;
  @Column()
  tournamentId: number;

}