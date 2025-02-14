/*
  Warnings:

  - You are about to drop the column `publidId` on the `Video` table. All the data in the column will be lost.
  - Added the required column `publicId` to the `Video` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Video" DROP COLUMN "publidId",
ADD COLUMN     "publicId" TEXT NOT NULL;
