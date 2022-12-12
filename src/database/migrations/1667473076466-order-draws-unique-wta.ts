import {MigrationInterface, QueryRunner} from "typeorm";

export class orderDrawsUniqueWta1667473076466 implements MigrationInterface {
    name="orderDrawsUniqueWta1667473076466";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await  queryRunner.query(`truncate table public.draw_order_atp`);
        await queryRunner.query(`ALTER TABLE draw_order_atp ADD CONSTRAINT "draw_order_atp_draw_key" UNIQUE (draw, "roundId", "player1Id", "player2Id", "tournamentId");`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
