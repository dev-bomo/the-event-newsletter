-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "city" TEXT,
    "profile" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "resetCode" TEXT,
    "resetCodeExpiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("city", "createdAt", "email", "id", "name", "passwordHash", "profile", "resetCode", "resetCodeExpiresAt", "updatedAt") SELECT "city", "createdAt", "email", "id", "name", "passwordHash", "profile", "resetCode", "resetCodeExpiresAt", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
