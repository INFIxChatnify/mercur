import { Migration } from '@mikro-orm/migrations';

export class Migration20250622000001 extends Migration {

  override async up(): Promise<void> {
    // Add unique constraint to prevent duplicate media records
    this.addSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_digital_product_media_unique_file" 
      ON "digital_product_media" (digital_product_id, "fileId", type) 
      WHERE deleted_at IS NULL;
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_digital_product_media_unique_file";`);
  }

}