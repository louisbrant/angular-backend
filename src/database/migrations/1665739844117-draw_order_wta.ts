import {MigrationInterface, QueryRunner} from "typeorm";

export class drawOrderWta1665739844117 implements MigrationInterface {
    name="drawOrderWta1665739844117";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "draw_order_wta" ("id" SERIAL NOT NULL, "draw" integer NOT NULL UNIQUE, PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "draw_order_wta"`);
    }

}
