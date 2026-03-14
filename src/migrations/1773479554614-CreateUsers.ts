import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsers1773479554614 implements MigrationInterface {
    name = 'CreateUsers1773479554614'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL, "tgId" character varying NOT NULL, "tgUsername" character varying, "tgFirstName" character varying NOT NULL, "tgLastName" character varying, "tgLanguageCode" character varying, "tgIsPremium" boolean NOT NULL DEFAULT false, "isBot" boolean NOT NULL DEFAULT false, "createdAt" bigint NOT NULL, "updatedAt" bigint NOT NULL, "deletedAt" bigint, CONSTRAINT "UQ_6b4510830e7603b438fecf44b14" UNIQUE ("tgId"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "users"`);
    }

}