import {MigrationInterface, QueryRunner} from "typeorm";

export class addDrawPositionForGames1649886601888 implements MigrationInterface {
    name = 'addDrawPositionForGames1649886601888'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "game_atp" ADD "draw" integer`);
        await queryRunner.query(`ALTER TABLE "game_wta" ADD "draw" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "game_wta" DROP COLUMN "draw"`);
        await queryRunner.query(`ALTER TABLE "game_atp" DROP COLUMN "draw"`);
    }

}
