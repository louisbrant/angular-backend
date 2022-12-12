import { MigrationInterface, QueryRunner } from "typeorm"

export class atpDrawsFields1666088916215 implements MigrationInterface {
    name="atpDrawsFields1666088916215";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE draw_order_atp ADD COLUMN "date" TIMESTAMP, ADD COLUMN "tournamentId" integer, ADD COLUMN "player1Id" integer, ADD COLUMN "player2Id" integer, ADD COLUMN "roundId" integer, DROP CONSTRAINT draw_order_atp_draw_key`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
