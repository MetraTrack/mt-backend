import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFoodEntries1773479563085 implements MigrationInterface {
    name = 'CreateFoodEntries1773479563085'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "food_entries" ("id" uuid NOT NULL, "userId" character varying NOT NULL, "photoId" character varying NOT NULL, "analysisProvider" character varying NOT NULL, "analysisModel" character varying NOT NULL, "mealSummary" text NOT NULL, "portionGrams" double precision NOT NULL, "caloriesKcal" double precision NOT NULL, "proteinsGrams" double precision NOT NULL, "fatsGrams" double precision NOT NULL, "carbsGrams" double precision NOT NULL, "confidence" double precision NOT NULL, "notes" text, "eatenAt" bigint, "createdAt" bigint NOT NULL, "updatedAt" bigint NOT NULL, "deletedAt" bigint, CONSTRAINT "UQ_1c14c9e2ceed1908110b295c66e" UNIQUE ("photoId"), CONSTRAINT "PK_9ff4018d66bc4142ac2222a3ad0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."food_reviews_type_enum" AS ENUM('DAILY', 'WEEKLY', 'MONTHLY')`);
        await queryRunner.query(`CREATE TABLE "food_reviews" ("id" uuid NOT NULL, "userId" character varying NOT NULL, "type" "public"."food_reviews_type_enum" NOT NULL, "periodStart" bigint NOT NULL, "periodEnd" bigint NOT NULL, "sourceReviewIds" jsonb, "summaryText" text NOT NULL, "recommendationsText" text NOT NULL, "rawReviewData" jsonb, "createdAt" bigint NOT NULL, "updatedAt" bigint NOT NULL, "deletedAt" bigint, CONSTRAINT "PK_ac20968ee78f19bed54aed925bf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "food_review_source_entries" ("review_id" uuid NOT NULL, "entry_id" uuid NOT NULL, CONSTRAINT "PK_e1c6c12a58483d77c483c388444" PRIMARY KEY ("review_id", "entry_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f509a17f35ab0583ed51332571" ON "food_review_source_entries" ("review_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_7318feb89a26a063485ea1b5a4" ON "food_review_source_entries" ("entry_id") `);
        await queryRunner.query(`ALTER TABLE "food_review_source_entries" ADD CONSTRAINT "FK_f509a17f35ab0583ed51332571d" FOREIGN KEY ("review_id") REFERENCES "food_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "food_review_source_entries" ADD CONSTRAINT "FK_7318feb89a26a063485ea1b5a45" FOREIGN KEY ("entry_id") REFERENCES "food_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "food_review_source_entries" DROP CONSTRAINT "FK_7318feb89a26a063485ea1b5a45"`);
        await queryRunner.query(`ALTER TABLE "food_review_source_entries" DROP CONSTRAINT "FK_f509a17f35ab0583ed51332571d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7318feb89a26a063485ea1b5a4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f509a17f35ab0583ed51332571"`);
        await queryRunner.query(`DROP TABLE "food_review_source_entries"`);
        await queryRunner.query(`DROP TABLE "food_reviews"`);
        await queryRunner.query(`DROP TYPE "public"."food_reviews_type_enum"`);
        await queryRunner.query(`DROP TABLE "food_entries"`);
    }

}
