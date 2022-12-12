import {MigrationInterface, QueryRunner} from "typeorm";

export class drawOrderApt1665739165273 implements MigrationInterface {
    name = 'drawOrderApt1665739165273'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "draw_order_atp" ("id" SERIAL NOT NULL, "draw" integer NOT NULL UNIQUE, PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "draw_order_apt"`);
    }

}
