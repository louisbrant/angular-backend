import {MigrationInterface, QueryRunner} from "typeorm";

export class ranks1645478314225 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.manager
          .createQueryBuilder('Rank', 'rank')
          .insert()
          .into('Rank')
          .values([
              { id: 0, name: 'Futures/Satellites/ITF tournaments $10K' },
              { id: 1, name: 'Challengers/ITF tournaments > $10K' },
              { id: 2, name: 'Main tour' },
              { id: 3, name: 'Masters series' },
              { id: 4, name: 'Grand Slam' },
              { id: 5, name: 'Davis/Fed Cup' },
              { id: 6, name: 'Non ATP/WTA Events + Juniors' },
          ])
          .execute();
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
