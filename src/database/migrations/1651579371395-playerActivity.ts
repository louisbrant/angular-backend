import {MigrationInterface, QueryRunner} from "typeorm";

export class playerActivity1651579371395 implements MigrationInterface {
    name = 'playerActivity1651579371395'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ep_atp" ADD "playerStatus" character varying NOT NULL DEFAULT 'Active'`);
        await queryRunner.query(`ALTER TABLE "ep_wta" ADD "playerStatus" character varying NOT NULL DEFAULT 'Active'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ep_wta" DROP COLUMN "playerStatus"`);
        await queryRunner.query(`ALTER TABLE "ep_atp" DROP COLUMN "playerStatus"`);
    }
}
