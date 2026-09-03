/*
  Warnings:

  - You are about to drop the column `adminLevel` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `hubId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `hubs` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_hubId_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "adminLevel",
DROP COLUMN "hubId";

-- DropTable
DROP TABLE "hubs";

-- DropEnum
DROP TYPE "AdminLevel";
