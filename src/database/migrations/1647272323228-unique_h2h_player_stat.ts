import {MigrationInterface, QueryRunner} from "typeorm";

export class uniqueH2hPlayerStat1647272323228 implements MigrationInterface {
    name = 'uniqueH2hPlayerStat1647272323228'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "player_stat_atp" DROP CONSTRAINT "FK_1fb9dcb2ed341ac3921b7a40997"`);
        await queryRunner.query(`ALTER TABLE "player_stat_atp" ALTER COLUMN "playerId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "player_stat_atp" ADD CONSTRAINT "UQ_1fb9dcb2ed341ac3921b7a40997" UNIQUE ("playerId")`);
        await queryRunner.query(`ALTER TABLE "player_stat_wta" DROP CONSTRAINT "FK_e29d3d810d703b934aaac21ef98"`);
        await queryRunner.query(`ALTER TABLE "player_stat_wta" ALTER COLUMN "playerId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "player_stat_wta" ADD CONSTRAINT "UQ_e29d3d810d703b934aaac21ef98" UNIQUE ("playerId")`);
        await queryRunner.query(`ALTER TABLE "h2h_atp" ADD CONSTRAINT "UQ_bd515d640373600ba4ed076e5c5" UNIQUE ("player1Id", "player2Id")`);
        await queryRunner.query(`ALTER TABLE "h2h_wta" ADD CONSTRAINT "UQ_4385f07ab036a41d644bffa97d8" UNIQUE ("player1Id", "player2Id")`);
        await queryRunner.query(`ALTER TABLE "player_stat_atp" ADD CONSTRAINT "FK_1fb9dcb2ed341ac3921b7a40997" FOREIGN KEY ("playerId") REFERENCES "player_atp"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "player_stat_wta" ADD CONSTRAINT "FK_e29d3d810d703b934aaac21ef98" FOREIGN KEY ("playerId") REFERENCES "player_wta"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "player_stat_wta" DROP CONSTRAINT "FK_e29d3d810d703b934aaac21ef98"`);
        await queryRunner.query(`ALTER TABLE "player_stat_atp" DROP CONSTRAINT "FK_1fb9dcb2ed341ac3921b7a40997"`);
        await queryRunner.query(`ALTER TABLE "h2h_wta" DROP CONSTRAINT "UQ_4385f07ab036a41d644bffa97d8"`);
        await queryRunner.query(`ALTER TABLE "h2h_atp" DROP CONSTRAINT "UQ_bd515d640373600ba4ed076e5c5"`);
        await queryRunner.query(`ALTER TABLE "player_stat_wta" DROP CONSTRAINT "UQ_e29d3d810d703b934aaac21ef98"`);
        await queryRunner.query(`ALTER TABLE "player_stat_wta" ALTER COLUMN "playerId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "player_stat_wta" ADD CONSTRAINT "FK_e29d3d810d703b934aaac21ef98" FOREIGN KEY ("playerId") REFERENCES "player_wta"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "player_stat_atp" DROP CONSTRAINT "UQ_1fb9dcb2ed341ac3921b7a40997"`);
        await queryRunner.query(`ALTER TABLE "player_stat_atp" ALTER COLUMN "playerId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "player_stat_atp" ADD CONSTRAINT "FK_1fb9dcb2ed341ac3921b7a40997" FOREIGN KEY ("playerId") REFERENCES "player_atp"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
