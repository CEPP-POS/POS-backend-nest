import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAddOnSequence1709875816001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS add_on_add_on_id_seq`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP SEQUENCE IF EXISTS add_on_add_on_id_seq`);
  }
}
