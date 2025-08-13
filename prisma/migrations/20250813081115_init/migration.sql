/*
  Warnings:

  - The values [affiliate,agent] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."Role_new" AS ENUM ('user', 'admin', 'reseller');
ALTER TABLE "public"."User" ALTER COLUMN "userRole" DROP DEFAULT;
ALTER TABLE "public"."User" ALTER COLUMN "userRole" TYPE "public"."Role_new" USING ("userRole"::text::"public"."Role_new");
ALTER TYPE "public"."Role" RENAME TO "Role_old";
ALTER TYPE "public"."Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "public"."User" ALTER COLUMN "userRole" SET DEFAULT 'user';
COMMIT;
