import { MigrationInterface, QueryRunner } from "typeorm"

export class wtaDrawsFields1666088921565 implements MigrationInterface {
    name="wtaDrawsFields1666088921565";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE draw_order_wta ADD COLUMN "date" TIMESTAMP, ADD COLUMN "tournamentId" integer, ADD COLUMN "player1Id" integer, ADD COLUMN "player2Id" integer, ADD COLUMN "roundId" integer, DROP CONSTRAINT draw_order_wta_draw_key`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
