import {MigrationInterface, QueryRunner} from "typeorm";

export class drawOrderUniqueKeysWta1667542569033 implements MigrationInterface {
    name="drawOrderUniqueKeysWta1667542569033";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await  queryRunner.query(`truncate table public.draw_order_wta`);

        await queryRunner.query(`ALTER TABLE draw_order_wta ADD CONSTRAINT "draw_order_draw_wta_key" UNIQUE (draw, "roundId", "player1Id", "player2Id", "tournamentId");`);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
