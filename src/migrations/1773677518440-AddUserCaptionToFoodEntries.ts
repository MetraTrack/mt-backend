import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserCaptionToFoodEntries1773677518440 implements MigrationInterface {
    name = 'AddUserCaptionToFoodEntries1773677518440'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "food_entries" ADD "userCaption" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "food_entries" DROP COLUMN "userCaption"`);
    }

}
