/*
  Warnings:

  - Added the required column `requirementId` to the `requirements` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_requirements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requirementId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "acceptanceCriteria" TEXT,
    "businessValue" TEXT,
    "userStory" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "type" TEXT NOT NULL DEFAULT 'FUNCTIONAL',
    "complexity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "estimatedEffort" REAL,
    "actualEffort" REAL,
    "projectId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "parentId" TEXT,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "requirements_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "requirements_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "requirements_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "requirements_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "requirements" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_requirements" ("acceptanceCriteria", "actualEffort", "assignedToId", "businessValue", "complexity", "createdAt", "createdById", "currentVersion", "description", "dueDate", "estimatedEffort", "id", "parentId", "priority", "projectId", "status", "title", "type", "updatedAt", "userStory") SELECT "acceptanceCriteria", "actualEffort", "assignedToId", "businessValue", "complexity", "createdAt", "createdById", "currentVersion", "description", "dueDate", "estimatedEffort", "id", "parentId", "priority", "projectId", "status", "title", "type", "updatedAt", "userStory" FROM "requirements";
DROP TABLE "requirements";
ALTER TABLE "new_requirements" RENAME TO "requirements";
CREATE UNIQUE INDEX "requirements_requirementId_key" ON "requirements"("requirementId");
CREATE INDEX "requirements_projectId_idx" ON "requirements"("projectId");
CREATE INDEX "requirements_createdById_idx" ON "requirements"("createdById");
CREATE INDEX "requirements_assignedToId_idx" ON "requirements"("assignedToId");
CREATE INDEX "requirements_parentId_idx" ON "requirements"("parentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
