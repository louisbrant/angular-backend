import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { H2hAtp, H2hWta } from 'src/modules/h2h/entity/h2h.entity';

@Injectable()
export class InterestingH2hService {
  constructor(
    @InjectRepository(H2hAtp)
    private h2hAtpRepository: Repository<H2hAtp>,
    @InjectRepository(H2hWta)
    private h2hWtaRepository: Repository<H2hWta>,
  ) {}

  public interestingH2h(type: string) {
    let h2hRepository: Repository<H2hAtp> | Repository<H2hWta> | undefined;
    if (type == 'atp') {
      h2hRepository = this.h2hAtpRepository;
    } else if (type == 'wta') {
      h2hRepository = this.h2hWtaRepository;
    } else {
      return { error: 'Type not found!' };
    }

    return h2hRepository
      .createQueryBuilder('h2')
      .leftJoin('h2.player1', 'player1')
      .leftJoin('h2.player2', 'player2')
      .select(['h2.player1Wins', 'h2.player2Wins'])
      .addSelect(['(h2.player1Wins + h2.player2Wins) as totalGames'])
      .addSelect(['player1.countryAcr', 'player2.countryAcr'])
      .addSelect(['player1.name', 'player2.name'])
      .where(`player1.name!= '' AND player1.name!= 'Unknown Player' AND player1.name!= 'Unknown Player/Unknown Player' AND player2.name!='' AND player1.name!= 'Unknown Player' AND player1.name!= 'Unknown Player/Unknown Player' AND player1.id>player2.id`)
      .orderBy('totalGames', 'DESC')
      .limit(10)
      .getMany()
  }
}
