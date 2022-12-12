import {MigrationInterface, QueryRunner} from "typeorm";

export class matchTimeType1648577965916 implements MigrationInterface {
    name = 'matchTimeType1648577965916'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stat_atp" DROP COLUMN "mt"`);
        await queryRunner.query(`ALTER TABLE "stat_atp" ADD "mt" character varying`);
        await queryRunner.query(`ALTER TABLE "stat_wta" DROP COLUMN "mt"`);
        await queryRunner.query(`ALTER TABLE "stat_wta" ADD "mt" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stat_wta" DROP COLUMN "mt"`);
        await queryRunner.query(`ALTER TABLE "stat_wta" ADD "mt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "stat_atp" DROP COLUMN "mt"`);
        await queryRunner.query(`ALTER TABLE "stat_atp" ADD "mt" TIMESTAMP`);
    }

}
