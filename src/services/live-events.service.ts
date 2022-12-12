import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TodayAtp, TodayWta } from 'src/modules/today/entity/today.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { SharedService } from 'src/services/shared.service';

@Injectable()
export class LiveEventsService {
  constructor(
    @InjectRepository(TodayAtp)
    private todayAtpRepository: Repository<TodayAtp>,
    @InjectRepository(TodayWta)
    private todayWtaRepository: Repository<TodayWta>,
    private sharedService: SharedService,
  ) {}

  public liveEvents(type: string) {
    let todayRepository: Repository<TodayWta> | Repository<TodayAtp> | undefined;
    if (type == 'atp') {
      todayRepository = this.todayAtpRepository;
    } else if (type == 'wta') {
      todayRepository = this.todayWtaRepository;
    } else {
      return {error: 'Type not found!'}
    }

    return todayRepository
      .createQueryBuilder('today')
      .select(['today.id', 'tournament.name', 'tournament.id', 'tournament.date'])
      .leftJoin('today.tournament', 'tournament')
      .leftJoinAndSelect('tournament.country', 'country')
      .distinctOn(['tournament.name'])
      .getMany()
      .then((todays) =>
        todays.map((today) => ({
          name: today.tournament.name,
          country: today.tournament.country.name,
          image: this.sharedService.getTournamentImage(
            'atp',
            today.tournament.id,
          ),
          date: today.tournament.date,
        })),
      );
  }
}
