import { MigrationInterface, QueryRunner } from "typeorm"

export class versionAddInProgress1666088921566 implements MigrationInterface {
    name="versionAddInProgress1666088921566";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "version" ADD "inProgress" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "version" DROP COLUMN "inProgress"`);
    }


}
