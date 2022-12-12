import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RatingAtp, RatingWta } from 'src/modules/ratings/entity/rating.entity';
import { Like, Repository, SelectQueryBuilder } from 'typeorm';
import { PlayerAtp, PlayerWta } from 'src/modules/player/entity/player.entity';
import { Country } from 'src/modules/country/entity/country.entity';
import { Court } from 'src/modules/court/entity/court.entity';
import { SharedService } from 'src/services/shared.service';
import {
  TournamentAtp,
  TournamentWta,
} from 'src/modules/tournament/entity/tournament.entity';
import { tour } from 'src/modules/shared/middlewares/tour.middleware';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(PlayerAtp)
    private playerAtpRepository: Repository<PlayerAtp>,
    @InjectRepository(PlayerWta)
    private playerWtaRepository: Repository<PlayerWta>,
    @InjectRepository(TournamentAtp)
    private tournamentAtpRepository: Repository<TournamentAtp>,
    @InjectRepository(TournamentWta)
    private tournamentWtaRepository: Repository<TournamentWta>,
    private sharedService: SharedService,
  ) {}

  public categories = [
    'player_atp',
    'player_wta',
    'tournament_atp',
    'tournament_wta',
  ];

  public async elasticSearch(search: string) {
    const result = [];

    const tournamentAtpSearch = this.tournamentAtpRepository
      .createQueryBuilder('tournament')
      .select(['tournament.name', 'tournament.date'])
      .where(`LOWER(tournament.name) like '%${search}%'`);
    const tournamentWtaSearch = this.tournamentWtaRepository
      .createQueryBuilder('tournament')
      .select(['tournament.name', 'tournament.date'])
      .where(`LOWER(tournament.name) like '%${search}%'`);

    // TODO: maybe need image of profile
    result.push({
      category: 'player_atp',
      total: await this.searchPlayer('atp', search).getCount(),
      result: await this.searchPlayer('atp', search).limit(5).getMany(),
    });
    result.push({
      category: 'player_wta',
      total: await this.searchPlayer('wta', search).getCount(),
      result: await this.searchPlayer('wta', search).limit(5).getMany(),
    });

    result.push({
      category: 'tournament_atp',
      total: await this.searchTournament('atp', search).getCount(),
      result: await this.searchTournament('atp', search).limit(5).getMany(),
    });
    result.push({
      category: 'tournament_wta',
      total: await this.searchTournament('wta', search).getCount(),
      result: await this.searchTournament('wta', search).limit(5).getMany(),
    });

    return result;
  }

  public async searchByCategory(search: string, category: string) {
    let result;

    if (category == 'player_atp') {
      result = await this.searchPlayer('atp', search).getMany();
    }

    if (category == 'player_wta') {
      result = await this.searchPlayer('wta', search).getMany();
    }

    if (category == 'tournament_atp') {
      result = await this.searchTournament('atp', search).getMany();
    }

    if (category == 'tournament_wta') {
      result = await this.searchTournament('wta', search).getMany();
    }

    return result;
  }

  private searchPlayer(
    type: 'atp' | 'wta',
    search: string,
  ): SelectQueryBuilder<PlayerAtp | PlayerWta> {
    let playerRepository;
    if (type === 'atp') {
      playerRepository = this.playerAtpRepository;
    }
    if (type === 'wta') {
      playerRepository = this.playerWtaRepository;
    }
    return playerRepository
      .createQueryBuilder('player')
      .select(['player.name', 'player.birthday', 'player.countryAcr'])
      .where(`LOWER(player.name) like '%${search}%'`)
      .andWhere("player.name not like '%/%'");
  }

  private searchTournament(
    type: 'atp' | 'wta',
    search: string,
  ): SelectQueryBuilder<TournamentAtp | TournamentWta> {
    let tournamentRepository;
    if (type === 'atp') {
      tournamentRepository = this.tournamentAtpRepository;
    }
    if (type === 'wta') {
      tournamentRepository = this.tournamentWtaRepository;
    }
    return tournamentRepository
      .createQueryBuilder('tournament')
      .select(['tournament.name', 'tournament.date'])
      .where(`LOWER(tournament.name) like '%${search}%'`)
      .orWhere(`to_char(tournament.date, 'YYYY-MM-DD') like '%${search}%'`);
  }
}
