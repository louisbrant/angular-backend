import {MigrationInterface, QueryRunner} from "typeorm";

export class orderDrawsUniqueAtp1667473069962 implements MigrationInterface {
    name="orderDrawsUniqueAtp1667473069962";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await  queryRunner.query(`truncate table public.draw_order_atp`);
        await queryRunner.query(`ALTER TABLE draw_order_atp ADD CONSTRAINT "draw_order_wta_draw_key" UNIQUE (draw, "roundId", "player1Id", "player2Id", "tournamentId");`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
