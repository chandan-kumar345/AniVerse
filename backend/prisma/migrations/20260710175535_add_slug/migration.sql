/*
  Warnings:

  - Added the required column `slug` to the `Anime` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Anime" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "malId" INTEGER,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "englishTitle" TEXT,
    "description" TEXT NOT NULL,
    "bannerImage" TEXT,
    "posterImage" TEXT,
    "rating" TEXT,
    "score" REAL NOT NULL DEFAULT 0.0,
    "type" TEXT NOT NULL DEFAULT 'TV',
    "studio" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Finished Airing',
    "releasedYear" INTEGER,
    "duration" TEXT,
    "genres" TEXT NOT NULL,
    "isTrending" BOOLEAN NOT NULL DEFAULT false,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Anime" ("bannerImage", "createdAt", "description", "duration", "englishTitle", "genres", "id", "isPopular", "isTrending", "malId", "posterImage", "rating", "releasedYear", "score", "status", "studio", "title", "type", "updatedAt") SELECT "bannerImage", "createdAt", "description", "duration", "englishTitle", "genres", "id", "isPopular", "isTrending", "malId", "posterImage", "rating", "releasedYear", "score", "status", "studio", "title", "type", "updatedAt" FROM "Anime";
DROP TABLE "Anime";
ALTER TABLE "new_Anime" RENAME TO "Anime";
CREATE UNIQUE INDEX "Anime_slug_key" ON "Anime"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
