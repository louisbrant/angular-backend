import {MigrationInterface, QueryRunner} from "typeorm";

export class version1656565782710 implements MigrationInterface {
    name = 'version1656565782710'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "version" ("ver" character varying NOT NULL, "dat" character varying NOT NULL, "atp" character varying NOT NULL, "wta" character varying NOT NULL, CONSTRAINT "PK_d9ba39728cf6cf65fc62d84ee22" PRIMARY KEY ("ver"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "version"`);
    }

}
