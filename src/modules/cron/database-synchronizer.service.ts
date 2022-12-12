import { Connection, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Cron, Timeout } from '@nestjs/schedule';
import { DatabaseCalculationService } from 'src/modules/cron/database-calculation.service';
import { InjectRepository } from '@nestjs/typeorm';
import { H2hAtp, H2hWta } from '../h2h/entity/h2h.entity';
import { PlayerStatAtp, PlayerStatWta } from '../player-stats/entity/player-stat.entity';
import { GameAtp, GameWta } from '../game/entity/game.entity';
import { RatingAtp, RatingWta } from '../ratings/entity/rating.entity';
import { StatAtp, StatWta } from '../stat/entity/stat.entity';

@Injectable()
export class DatabaseSynchronizerService {
  constructor(
    private connection: Connection,
    private databaseCalculationService: DatabaseCalculationService,
    @InjectRepository(GameAtp)
    private GameAtpRepository: Repository<GameAtp>,
    @InjectRepository(GameWta)
    private GameWtaRepository: Repository<GameWta>,
    @InjectRepository(StatAtp)
    private StatAtpRepository: Repository<StatAtp>,
    @InjectRepository(StatWta)
    private StatWtaRepository: Repository<StatWta>,
    @InjectRepository(RatingAtp)
    private RatingAtpRepository: Repository<RatingAtp>,
    @InjectRepository(RatingWta)
    private RatingWtaRepository: Repository<RatingWta>,
  ) { }

  @Timeout(1000)
  public async synchZeroProgress() {
    let current = await this.connection.query(`SELECT * FROM public.version;`)
    if (current[0] == undefined) {
      await this.connection.query(`
      truncate table public.version;

      insert into public.version(ver, dat, atp, wta, "inProgress")
      values (0, '2000.01.01', '2000.01.01', '2000.01.01', 0);`)
    }
    await this.connection.query(`update public.version set "inProgress"=0;`)
    console.log('--- Synchronize allowed ', new Date(), ' ---');
  }

  @Cron('0 0 4 * * 1,4')
  public async clearSequences() {
    let target = await this.connection.query(`SELECT * FROM matchstatdb.version;`)
    let current = await this.connection.query(`SELECT * FROM public.version;`)
    if (target.length > 0 && current[0]['inProgress'] == 0 && target[0]['progress'] == 0) {
      await this.connection.manager.query(`
        truncate table public.rating_wta;
        truncate table public.rating_atp;
        truncate table public.today_atp;
        truncate table public.today_wta;
        truncate table public.player_stat_atp;
        truncate table public.player_stat_wta;
        truncate table public.game_atp;
        truncate table public.game_wta;
        truncate table public.h2h_atp;
        truncate table public.h2h_wta;
        truncate table public.stat_atp;
        truncate table public.stat_wta;
      `);
      await this.synchZeroProgress().then(() => {
        console.log(new Date(), 'Public base truncated');
      });
    }else{
      console.log(new Date(), 'Public base can not be truncated, while synch');
    }
  }


  private async drawOrderAtp() {
    await this.connection.manager.query(`
    INSERT INTO draw_order_atp (draw, date, "roundId", "player1Id", "player2Id", "tournamentId")
    SELECT draw, date, "roundId", "player1Id", "player2Id", "tournamentId"
    FROM public.today_atp
    ON conflict (draw, "roundId", "player1Id", "player2Id", "tournamentId") DO UPDATE SET draw=excluded.draw, "roundId"=excluded."roundId", "player1Id"=excluded."player1Id", "player2Id"=excluded."player2Id", "tournamentId"=excluded."tournamentId";
    `)
  }

  private async drawOrderWta() {
    await this.connection.manager.query(`
    INSERT INTO draw_order_wta (draw, date, "roundId", "player1Id", "player2Id", "tournamentId")
    SELECT draw, date, "roundId", "player1Id", "player2Id", "tournamentId"
    FROM  public.today_wta tw
    ON conflict (draw, "roundId", "player1Id", "player2Id", "tournamentId") DO UPDATE SET draw=excluded.draw, "roundId"=excluded."roundId", "player1Id"=excluded."player1Id", "player2Id"=excluded."player2Id", "tournamentId"=excluded."tournamentId";
    `)
  }


  @Cron('0 */1 * * * *')
  public async parse() {
    console.log('--- Synchronize check ', new Date(), ' ---');
    let target = await this.connection.query(`SELECT * FROM matchstatdb.version;`)
    let current = await this.connection.query(`SELECT * FROM public.version;`)
    if (target.length > 0 && current[0]['inProgress'] == 0 && target[0]['progress'] == 0) {
      if (target.length > 0) {
        console.log(target[0]['ver'])
      }
      if (current.length > 0) {
        console.log(current[0]['ver'])
      }
      if (target[0]['ver'] != current[0]['ver']) {
        console.log('--- Synchronize Start ', new Date(), ' ---');
        await this.connection.query(`update public.version set "inProgress"=1;`)

        await this.synchronizeOther().then(() => {
          console.log(new Date(), 'other synchronize complete');
        });

        await this.synchronizeRating().then(() => {
          console.log(new Date(), 'rating synchronize complete');
        });

        await this.synchronizeTournament().then(() => {
          console.log(new Date(), 'tournament synchronize complete');
        });

        await this.synchronizeGame().then(() => {
          console.log(new Date(), 'game synchronize complete');
        });

        await this.synchronizeToday().then(() => {
          console.log(new Date(), 'today synchronize complete');
        });

        await this.saveDrawPosition().then(() => {
          console.log(new Date(), 'saving draw complete')
        });

        await this.synchronizeStat().then(() => {
          console.log(new Date(), 'stat synchronize complete');
        });

        await this.drawOrderAtp().then(() => {
          console.log(new Date(), 'saving draw_order_apt');
        });

        await this.drawOrderWta().then(() => {
          console.log(new Date(), 'saving draw_order_wta');
        });

        await this.drawAtp().then(() => {
          console.log(new Date(), 'saving draw_atp');
        });

        await this.drawWta().then(() => {
          console.log(new Date(), 'saving draw_wta');
        });

        await this.databaseCalculationService.calculate('atp').then(() => {
          console.log(new Date(), 'atp calculation complete');
        });

        await this.databaseCalculationService.calculate('wta').then(() => {
          console.log(new Date(), 'wta calculation complete');
        });

        await this.connection.query(`
          truncate table public.version;

          insert into public.version
          select *
          from matchstatdb.version;

          update public.version set "inProgress"=0;
          `).then(() => {
          console.log('--- Synchronize Complete ', new Date(), ' ---');
        });

      } else {
        console.log('--- Synchronize not required ', new Date(), ' ---');
      }
    } else {
      console.log('--- Other Synchronize in progress ', new Date(), ' ---');
    }
  }

  private async drawAtp() {
    await this.connection.manager.query(`
    update game_atp game
    set draw = draw.draw 
    from draw_order_atp as "draw"
    where (draw."tournamentId" = game."tournamentId" 
    and draw."player1Id" = game."player1Id"
    and draw."player2Id" = game."player2Id"
    and draw."roundId" = game."roundId");
    `)
  }

  private async drawWta() {
    await this.connection.manager.query(`
    update game_wta game
    set draw = draw.draw 
    from draw_order_wta as "draw"
    where (draw."tournamentId" = game."tournamentId" 
    and draw."player1Id" = game."player1Id"
    and draw."player2Id" = game."player2Id" 
    and draw."roundId" = game."roundId");
    `)
  }

  private async synchronizeOther() {
    await this.connection.manager.query(
      `
            insert into public.point
            select *
            from matchstatdb.points p
            where p.id_pnt not in (select id from public.point)
            on conflict ("id") do nothing;

            insert into public.country
            select distinct on (acronym_c) *
            from matchstatdb.countries mc
            where mc.acronym_c not in (select acronym from public.country);

            insert into public.country (name, acronym)
            select distinct on (country_p) '', country_p
            from matchstatdb.players_atp
            where country_p not in (select acronym from public.country);

            insert into public.country
            select distinct on (country_p) '', country_p
            from matchstatdb.players_wta
            where country_p not in (select acronym from public.country);

            insert into public.country
            select distinct on (country_t) '', country_t
            from matchstatdb.tours_atp
            where country_t not in (select acronym from public.country);

            insert into public.country
            select distinct on (country_t) '', country_t
            from matchstatdb.tours_wta
            where country_t not in (select acronym from public.country);

            insert into public.player_atp
            select *
            from matchstatdb.players_atp mp
            on conflict ("id") do update set name=excluded.name, birthday=excluded.birthday, "countryAcronym"=excluded."countryAcronym", "currentRank"=excluded."currentRank", progress=excluded.progress, points=excluded.points, "hardPoints"=excluded."hardPoints", "hardTournament"=excluded."hardTournament", "clayPoints"=excluded."clayPoints", "clayTournament"=excluded."clayTournament", "grassPoints"=excluded."grassPoints","grassTournament"=excluded."grassTournament", "carpetPoints"=excluded."carpetPoints", "carterTournament"=excluded."carterTournament", prize=excluded.prize, ch=excluded.ch, "doublesPosition"=excluded."doublesPosition", "doublesProgress"=excluded."doublesProgress", "doublesPoints"=excluded."doublesPoints", "ihardPoints"=excluded."ihardPoints", "ihardTournament"=excluded."ihardTournament", itf=excluded.itf;

            insert into public.player_wta
            select *
            from matchstatdb.players_wta mp
            on conflict ("id") do update set name=excluded.name, birthday=excluded.birthday, "countryAcronym"=excluded."countryAcronym", "currentRank"=excluded."currentRank", progress=excluded.progress, points=excluded.points, "hardPoints"=excluded."hardPoints", "hardTournament"=excluded."hardTournament", "clayPoints"=excluded."clayPoints", "clayTournament"=excluded."clayTournament", "grassPoints"=excluded."grassPoints","grassTournament"=excluded."grassTournament", "carpetPoints"=excluded."carpetPoints", "carterTournament"=excluded."carterTournament", prize=excluded.prize, ch=excluded.ch, "doublesPosition"=excluded."doublesPosition", "doublesProgress"=excluded."doublesProgress", "doublesPoints"=excluded."doublesPoints", "ihardPoints"=excluded."ihardPoints", "ihardTournament"=excluded."ihardTournament", itf=excluded.itf;

            insert into public.player_atp (id, name, birthday)
            select id_p, 'Unknown Player', now()
            from matchstatdb.ep_atp ep
            where ep.id_p not in (select id from public.player_atp);

            insert into public.player_wta (id, name, birthday)
            select id_p, 'Unknown Player', now()
            from matchstatdb.ep_wta ep
            where ep.id_p not in (select id from public.player_wta);

            insert into public.ep_atp
            select *
            from matchstatdb.ep_atp ep
            where ep.id_p not in (select id from public.ep_atp);
            
            insert into public.ep_wta
            select *
            from matchstatdb.ep_wta ep
            where ep.id_p not in (select id from public.ep_wta);
        `,
    );
  }

  private async synchronizeRating() {
    await this.RatingAtpRepository.count().then((val) => {
      if (val == 0) {
        this.connection.manager.query(`
          truncate table public.rating_atp;
          alter sequence rating_atp_id_seq restart;
        `)
      }
    })

    await this.connection.manager.query(`
        insert into public.player_atp (id, name, "countryAcronym")
        select distinct on (id_p_r) id_p_r, 'Unknown Player', 'N/A'
        from matchstatdb.ratings_atp
        where id_p_r not in (select id from public.player_atp);
        
        delete from public.rating_atp where extract(year from date) = extract(year from now());
        insert into public.rating_atp ("date", "point", "position", "playerId")
        select date_r, point_r, pos_r, id_p_r
        from matchstatdb.ratings_atp mr
            on conflict ("date", "playerId") do nothing;
            `);

    await this.RatingWtaRepository.count().then((val) => {
      if (val == 0) {
        this.connection.manager.query(`
        truncate table public.rating_wta;
        alter sequence rating_wta_id_seq restart;
        `)
      }
    })
    await this.connection.manager.query(`   
        insert into public.player_wta (id, name, "countryAcronym")
        select distinct on (id_p_r) id_p_r, 'Unknown Player', 'N/A'
        from matchstatdb.ratings_wta
        where id_p_r not in (select id from public.player_wta);

        delete from public.rating_wta where extract(year from date) = extract(year from now());
        insert into public.rating_wta ("date", "point", "position", "playerId")
        select date_r, point_r, pos_r, id_p_r
        from matchstatdb.ratings_wta mr
            on conflict ("date", "playerId") do nothing;
    `);
  }

  private async synchronizeTournament() {
    await this.connection.manager.query(`
        insert into public.tournament_atp
        select *
        from matchstatdb.tours_atp mt
        on conflict (id) do UPDATE SET name=excluded.name, "courtId"=excluded."courtId", date=excluded.date, "rankId"=excluded."rankId", link=excluded.link, "countryAcronym"=excluded."countryAcronym", prize=excluded.prize, "ratingId"=excluded."ratingId", url=excluded.url, latitude=excluded.latitude, longitude=excluded.longitude, site=excluded.site, race=excluded.race, entry=excluded.entry, "singlesPrizeId"=excluded."singlesPrizeId", "doublesMoneyId"=excluded."doublesMoneyId", tier=excluded.tier, "reserveInt"=excluded."reserveInt", "reserveChar"=excluded."reserveChar", live=excluded.live, result=excluded.result;
        insert into public.tournament_wta
        select *
        from matchstatdb.tours_wta
        on conflict (id) do UPDATE SET name=excluded.name, "courtId"=excluded."courtId", date=excluded.date, "rankId"=excluded."rankId", link=excluded.link, "countryAcronym"=excluded."countryAcronym", prize=excluded.prize, "ratingId"=excluded."ratingId", url=excluded.url, latitude=excluded.latitude, longitude=excluded.longitude, site=excluded.site, race=excluded.race, entry=excluded.entry, "singlesPrizeId"=excluded."singlesPrizeId", "doublesMoneyId"=excluded."doublesMoneyId", tier=excluded.tier, "reserveInt"=excluded."reserveInt", "reserveChar"=excluded."reserveChar", live=excluded.live, result=excluded.result;
    `);
    await this.connection.manager.query(`
      insert into rank ("id", "name")
      values (7, 'Tour finals'),(8, 'GS cup'),(9, 'Olympics')
      on conflict ("id") do nothing;

      UPDATE tournament_atp
      SET "rankId"=subquery.new_tour_cat
      FROM (
      select t.id,t."rankId",t.name, extract(year from t.date) as year,
      CASE WHEN (LOWER(t.name) like LOWER('%Grand Slam Cup%')) THEN 8
      WHEN (LOWER(t.name) like LOWER('%ARAG ATP%')) THEN 5
      WHEN (LOWER(t.name) like LOWER('%Masters Cup%')) THEN 7
      WHEN (LOWER(t.name) like LOWER('%Nitto ATP Finals%')) THEN 7
      WHEN (LOWER(t.name) like LOWER('%Tour world championship%')) THEN 7
      WHEN (LOWER(t.name) like LOWER('%ATP world tour finals%')) THEN 7
      WHEN (LOWER(t.name) like LOWER('%Next Gen%') and LOWER(t.name) NOT like LOWER('%Next Generation Hardcourts%') and LOWER(t.name) NOT like LOWER('%Next Generation Adelaide International - Adelaide%')) THEN 6
      WHEN (LOWER(t.name) like LOWER('%Laver%')) THEN 5
      WHEN (LOWER(t.name) like LOWER('%ATP cup%')) THEN 5
      WHEN (LOWER(t.name) like LOWER('%Hopman Cup%')) THEN 5
      WHEN (LOWER(t.name) like LOWER('%Olympics%')) THEN 9
      else 0
      END AS new_tour_cat
      from tournament_atp t
      where (LOWER(t.name) like LOWER('%Grand Slam Cup%')
      or LOWER(t.name) like LOWER('%ARAG ATP%')
      or LOWER(t.name) like LOWER('%Masters Cup%')
      or LOWER(t.name) like LOWER('%Nitto ATP Finals%')
      or LOWER(t.name) like LOWER('%Tour world championship%')
      or LOWER(t.name) like LOWER('%ATP world tour finals%')
      or (LOWER(t.name) like LOWER('%Next Gen%') and LOWER(t.name) NOT like LOWER('%Next Generation Hardcourts%') and LOWER(t.name) NOT like LOWER('%Next Generation Adelaide International - Adelaide%'))
      or LOWER(t.name) like LOWER('%Laver%')
      or LOWER(t.name) like LOWER('%ATP cup%')
      or LOWER(t.name) like LOWER('%Hopman Cup%')
      or LOWER(t.name) like LOWER('%Olympics%')
      )
      group by t.id
      order by t."rankId", year
      ) AS subquery
      WHERE tournament_atp.id=subquery.id;
    `);
  }

  private async synchronizeGame() {
    //sync atp
    await this.GameAtpRepository.count().then((val) => {
      if (val == 0) {
        this.connection.manager.query(`
          truncate table public.game_atp;
          alter sequence game_atp_id_seq restart;
        `)
      }
    })
    await this.connection.manager.query(`

        insert into public.player_atp (id, name, "countryAcronym")
        select distinct on (id1_g) id1_g, 'Unknown Player', 'N/A'
        from matchstatdb.games_atp
        where id1_g not in (select id from public.player_atp);
        insert into public.player_atp (id, name, "countryAcronym")
        select distinct on (id2_g) id2_g, 'Unknown Player', 'N/A'
        from matchstatdb.games_atp
        where id2_g not in (select id from public.player_atp);
        insert into public.tournament_atp (id, name, "courtId", "rankId", "countryAcronym", date)
        select distinct on (id_t_g) id_t_g, 'Unknown Tournament', 10, 0, 'N/A', date_g
        from matchstatdb.games_atp
        where id_t_g not in (select id from public.tournament_atp);
        insert into public.game_atp ("roundId", result, date, seed1, seed2, odd1, odd2, "player1Id", "player2Id",
                                     "tournamentId")
        select g.id_r_g,
               g.result_g,
               g.date_g,
               s1.seeding,
               s2.seeding,
               odd.k1,
               odd.k2,
               g.id1_g,
               g.id2_g,
               g.id_t_g
        from matchstatdb.games_atp g
                 left join matchstatdb.seed_atp s1 on s1.id_t_s = ID_T_G and s1.id_p_s = g.ID1_G
                 left join matchstatdb.seed_atp s2 on s2.id_t_s = ID_T_G and s2.id_p_s = g.ID2_G
                 left join matchstatdb.odds_atp odd
                           on g.ID1_G = odd.ID1_O and g.ID2_G = odd.ID2_O and odd.ID_T_o = g.ID_T_G and odd.ID_B_O = 1
        on conflict ("player1Id", "player2Id", "tournamentId", "roundId") do nothing;
        `);
    await this.connection.manager.query(`
    UPDATE game_atp
    SET "date"=subquery."newdate"
    FROM (
      select g.*, t."date" as newdate
      from game_atp g 
      inner join tournament_atp t on t."id" = g."tournamentId" 
      where g."date" isnull 
      and g."result" != ''
      and g."result" is not null
    ) as subquery 
    where game_atp."id"=subquery."id";
    `)

    //sync wta
    await this.GameWtaRepository.count().then((val) => {
      if (val == 0) {
        this.connection.manager.query(`
              truncate table public.game_wta;
              alter sequence game_wta_id_seq restart;
            `)
      }
    })
    await this.connection.manager.query(`
        insert into public.player_wta (id, name, "countryAcronym")
        select distinct on (id1_g) id1_g, 'Unknown Player', 'N/A'
        from matchstatdb.games_wta
        where id1_g not in (select id from public.player_wta);
        insert into public.player_wta (id, name, "countryAcronym")
        select distinct on (id2_g) id2_g, 'Unknown Player', 'N/A'
        from matchstatdb.games_wta
        where id2_g not in (select id from public.player_wta);
        insert into public.tournament_wta (id, name, "courtId", "rankId", "countryAcronym", date)
        select distinct on (id_t_g) id_t_g, 'Unknown Tournament', 10, 0, 'N/A', date_g
        from matchstatdb.games_wta
        where id_t_g not in (select id from public.tournament_wta);
        insert into public.game_wta ("roundId", result, date, seed1, seed2, odd1, odd2, "player1Id", "player2Id",
                                     "tournamentId")
        select g.id_r_g,
               g.result_g,
               g.date_g,
               s1.seeding,
               s2.seeding,
               odd.k1,
               odd.k2,
               g.id1_g,
               g.id2_g,
               g.id_t_g
        from matchstatdb.games_wta g
                 left join matchstatdb.seed_wta s1 on s1.id_t_s = ID_T_G and s1.id_p_s = g.ID1_G
                 left join matchstatdb.seed_wta s2 on s2.id_t_s = ID_T_G and s2.id_p_s = g.ID2_G
                 left join matchstatdb.odds_wta odd
                           on g.ID1_G = odd.ID1_O and g.ID2_G = odd.ID2_O and odd.ID_T_o = g.ID_T_G and odd.ID_B_O = 1
        on conflict ("player1Id", "player2Id", "tournamentId", "roundId") do nothing;
    `);
    await this.connection.manager.query(`
    UPDATE game_wta
    SET "date"=subquery."newdate"
    FROM (
      select g.*, t."date" as newdate
      from game_wta g 
      inner join tournament_wta t on t."id" = g."tournamentId" 
      where g."date" isnull 
      and g."result" != ''
      and g."result" is not null
    ) as subquery 
    where game_wta."id"=subquery."id";
    `)
  }

  private async synchronizeToday() {
    await this.connection.manager.query(`
        truncate table public.today_atp;
        alter sequence today_atp_id_seq restart;
    `);
    await this.connection.manager.query(`
        insert into public.player_atp (id, name, "countryAcronym")
        select distinct on (id1) id1, 'Unknown Player', 'N/A'
        from matchstatdb.today_atp
        where id1 not in (select id from public.player_atp);
        insert into public.player_atp (id, name, "countryAcronym")
        select distinct on (id2) id2, 'Unknown Player', 'N/A'
        from matchstatdb.today_atp
        where id2 not in (select id from public.player_atp);
        insert into public.tournament_atp (id, name, "courtId", "rankId", "countryAcronym", date)
        select distinct on (tour) tour, 'Unknown Tournament', 10, 0, 'N/A', '${new Date().toLocaleDateString()}'
        from matchstatdb.today_atp
        where tour not in (select id from public.tournament_atp);
        insert into public.today_atp (date, "roundId", draw, result, complete, live, "timeGame", "reserveInt",
                                      "reserveString", odd1, odd2, seed1, seed2, "player1Id", "player2Id",
                                      "tournamentId")
        select t.date_game,
               t.round,
               t.draw,
               t.result,
               t.complete,
               t.live,
               t.time_game,
               t.reserve_int,
               t.reserve_char,
               odd.k1,
               odd.k2,
               s1.seeding,
               s2.seeding,
               t.id1,
               t.id2,
               t.tour
        from matchstatdb.today_atp t
                 left join matchstatdb.seed_atp s1 on s1.id_t_s = tour and s1.id_p_s = t.id1
                 left join matchstatdb.seed_atp s2 on s2.id_t_s = tour and s2.id_p_s = t.id2
                 left join matchstatdb.odds_atp odd
                           on t.id1 = odd.ID1_O and t.id2 = odd.ID2_O and odd.ID_T_o = t.tour and odd.ID_B_O = 1
        on conflict ("tournamentId", "player1Id", "player2Id", "roundId") do nothing;
        `);
    await this.connection.manager.query(`
        truncate table public.today_wta;
        alter sequence today_wta_id_seq restart;
    `);
    await this.connection.manager.query(`
        insert into public.player_wta (id, name, "countryAcronym")
        select distinct on (id1) id1, 'Unknown Player', 'N/A'
        from matchstatdb.today_wta
        where id1 not in (select id from public.player_wta);
        insert into public.player_wta (id, name, "countryAcronym")
        select distinct on (id2) id2, 'Unknown Player', 'N/A'
        from matchstatdb.today_wta
        where id2 not in (select id from public.player_wta);
        insert into public.tournament_wta (id, name, "courtId", "rankId", "countryAcronym", date)
        select distinct on (tour) tour, 'Unknown Tournament', 10, 0, 'N/A', '${new Date().toLocaleDateString()}'
        from matchstatdb.today_wta
        where tour not in (select id from public.tournament_wta);
        insert into public.today_wta (date, "roundId", draw, result, complete, live, "timeGame", "reserveInt",
                                      "reserveString", odd1, odd2, seed1, seed2, "player1Id", "player2Id",
                                      "tournamentId")
        select t.date_game,
               t.round,
               t.draw,
               t.result,
               t.complete,
               t.live,
               t.time_game,
               t.reserve_int,
               t.reserve_char,
               odd.k1,
               odd.k2,
               s1.seeding,
               s2.seeding,
               t.id1,
               t.id2,
               t.tour
        from matchstatdb.today_wta t
                 left join matchstatdb.seed_wta s1 on s1.id_t_s = tour and s1.id_p_s = t.id1
                 left join matchstatdb.seed_wta s2 on s2.id_t_s = tour and s2.id_p_s = t.id2
                 left join matchstatdb.odds_wta odd
                           on t.id1 = odd.ID1_O and t.id2 = odd.ID2_O and odd.ID_T_o = t.tour and odd.ID_B_O = 1
        on conflict ("tournamentId", "player1Id", "player2Id", "roundId") do nothing;
    `);
  }

  private async synchronizeStat() {
    await this.StatAtpRepository.count().then((val) => {
      if (val == 0) {
        this.connection.manager.query(`
          truncate table public.stat_atp;
          alter sequence stat_atp_id_seq restart;
        `);
      }
    })
    await this.connection.manager.query(`
        insert into public.player_atp (id, name, "countryAcronym")
        select distinct on (id1) id1, 'Unknown Player', 'N/A'
        from matchstatdb.stat_atp
        where id1 not in (select id from public.player_atp);
        insert into public.player_atp (id, name, "countryAcronym")
        select distinct on (id2) id2, 'Unknown Player', 'N/A'
        from matchstatdb.stat_atp
        where id2 not in (select id from public.player_atp);
        insert into public.tournament_atp (id, name, "courtId", "rankId", "countryAcronym", date)
        select distinct on (id_t) id_t, 'Unknown Tournament', 10, 0, 'N/A', now()
        from matchstatdb.stat_atp
        where id_t not in (select id from public.tournament_atp);
        insert into public.stat_atp ("player1Id",
                                     "player2Id",
                                     "tournamentId",
                                     "round",
                                     "firstServe1",
                                     "firstServeOf1",
                                     "aces1",
                                     "doubleFaults1",
                                     "unforcedErrors1",
                                     "winningOnFirstServe1",
                                     "winningOnFirstServeOf1",
                                     "winningOnSecondServe1",
                                     "winningOnSecondServeOf1",
                                     "winners1",
                                     "breakPointsConverted1",
                                     "breakPointsConvertedOf1",
                                     "netApproaches1",
                                     "netApproachesOf1",
                                     "totalPointsWon1",
                                     "fastestServe1",
                                     "averageFirstServeSpeed1",
                                     "averageSecondServeSpeed1",
                                     "firstServe2",
                                     "firstServeOf2",
                                     "aces2",
                                     "doubleFaults2",
                                     "unforcedErrors2",
                                     "winningOnFirstServe2",
                                     "winningOnFirstServeOf2",
                                     "winningOnSecondServe2",
                                     "winningOnSecondServeOf2",
                                     "winners2",
                                     "breakPointsConverted2",
                                     "breakPointsConvertedOf2",
                                     "netApproaches2",
                                     "netApproachesOf2",
                                     "totalPointsWon2",
                                     "fastestServe2",
                                     "averageFirstServeSpeed2",
                                     "averageSecondServeSpeed2",
                                     "rpw1",
                                     "rpwOf1",
                                     "rpw2",
                                     "rpwOf2",
                                     "mt")
        select *
        from matchstatdb.stat_atp
        on conflict ("player1Id", "player2Id", "tournamentId", "round") do nothing;
    `);
    await this.StatWtaRepository.count().then((val) => {
      if (val == 0) {
        this.connection.manager.query(`
          truncate table public.stat_wta;
          alter sequence stat_wta_id_seq restart;
        `);
      }
    })
    await this.connection.manager.query(`
        insert into public.player_wta (id, name, "countryAcronym")
        select distinct on (id1) id1, 'Unknown Player', 'N/A'
        from matchstatdb.stat_wta
        where id1 not in (select id from public.player_wta);
        insert into public.player_wta (id, name, "countryAcronym")
        select distinct on (id2) id2, 'Unknown Player', 'N/A'
        from matchstatdb.stat_wta
        where id2 not in (select id from public.player_wta);
        insert into public.tournament_wta (id, name, "courtId", "rankId", "countryAcronym", date)
        select distinct on (id_t) id_t, 'Unknown Tournament', 10, 0, 'N/A', now()
        from matchstatdb.stat_wta
        where id_t not in (select id from public.tournament_wta);
        insert into public.stat_wta ("player1Id",
                                     "player2Id",
                                     "tournamentId",
                                     "round",
                                     "firstServe1",
                                     "firstServeOf1",
                                     "aces1",
                                     "doubleFaults1",
                                     "unforcedErrors1",
                                     "winningOnFirstServe1",
                                     "winningOnFirstServeOf1",
                                     "winningOnSecondServe1",
                                     "winningOnSecondServeOf1",
                                     "winners1",
                                     "breakPointsConverted1",
                                     "breakPointsConvertedOf1",
                                     "netApproaches1",
                                     "netApproachesOf1",
                                     "totalPointsWon1",
                                     "fastestServe1",
                                     "averageFirstServeSpeed1",
                                     "averageSecondServeSpeed1",
                                     "firstServe2",
                                     "firstServeOf2",
                                     "aces2",
                                     "doubleFaults2",
                                     "unforcedErrors2",
                                     "winningOnFirstServe2",
                                     "winningOnFirstServeOf2",
                                     "winningOnSecondServe2",
                                     "winningOnSecondServeOf2",
                                     "winners2",
                                     "breakPointsConverted2",
                                     "breakPointsConvertedOf2",
                                     "netApproaches2",
                                     "netApproachesOf2",
                                     "totalPointsWon2",
                                     "fastestServe2",
                                     "averageFirstServeSpeed2",
                                     "averageSecondServeSpeed2",
                                     "rpw1",
                                     "rpwOf1",
                                     "rpw2",
                                     "rpwOf2",
                                     "mt")
        select *
        from matchstatdb.stat_wta
        on conflict ("player1Id", "player2Id", "tournamentId", "round") do nothing;
    `);
  }




  private async saveDrawPosition() {
    await this.connection.manager.query(`
        INSERT INTO public.game_atp ("roundId", "player1Id", "player2Id", "tournamentId", "draw", result, date)
        SELECT "roundId", "player1Id", "player2Id", "tournamentId", draw, result, date FROM public.today_atp
        ON CONFLICT ("roundId", "player1Id", "player2Id", "tournamentId") do update set draw=excluded."draw", result=excluded.result, date=excluded.date
    `);
    await this.connection.manager.query(`
        INSERT INTO public.game_wta ("roundId", "player1Id", "player2Id", "tournamentId", "draw", result, date)
        SELECT "roundId", "player1Id", "player2Id", "tournamentId", draw, result, date FROM public.today_wta
        ON CONFLICT ("roundId", "player1Id", "player2Id", "tournamentId") do update set draw=excluded."draw", result=excluded.result, date=excluded.date
    `);
  }
}
