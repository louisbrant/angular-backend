import {MigrationInterface, QueryRunner} from "typeorm";

export class courts1645478295378 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.manager
          .createQueryBuilder('Court', 'court')
          .insert()
          .into('Court')
          .values([
              { id: 6, name: 'Acrylic' },
              { id: 10, name: 'N/A' },
              { id: 2, name: 'Clay' },
              { id: 5, name: 'Grass' },
              { id: 4, name: 'Carpet' },
              { id: 1, name: 'Hard' },
              { id: 3, name: 'I.hard' },
          ])
          .execute();
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
