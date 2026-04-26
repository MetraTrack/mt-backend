import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAnalysisSourceAndMakePhotoIdNullable1777228483056 implements MigrationInterface {
    name = 'AddAnalysisSourceAndMakePhotoIdNullable1777228483056'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Backfill existing rows as 'photo' before enforcing NOT NULL
        await queryRunner.query(`ALTER TABLE "food_entries" ADD "analysisSource" character varying NOT NULL DEFAULT 'photo'`);
        await queryRunner.query(`ALTER TABLE "food_entries" ALTER COLUMN "analysisSource" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "food_entries" ALTER COLUMN "photoId" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "food_entries" ALTER COLUMN "photoId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "food_entries" DROP COLUMN "analysisSource"`);
    }

}
