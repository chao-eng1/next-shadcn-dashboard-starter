-- CreateTable
CREATE TABLE "requirements" (
    "id" TEXT NOT NULL PRIMARY KEY,
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

-- CreateTable
CREATE TABLE "requirement_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requirementId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "acceptanceCriteria" TEXT,
    "businessValue" TEXT,
    "changeReason" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "requirement_versions_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "requirements" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "requirement_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "requirement_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requirementId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "requirement_tasks_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "requirements" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "requirement_tasks_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "requirement_comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "requirement_comments_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "requirements" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "requirement_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "requirement_attachments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "requirementId" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "requirement_attachments_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "requirements" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "requirement_attachments_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "requirement_tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requirementId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "requirement_tags_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "requirements" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "requirement_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "requirements_projectId_idx" ON "requirements"("projectId");

-- CreateIndex
CREATE INDEX "requirements_createdById_idx" ON "requirements"("createdById");

-- CreateIndex
CREATE INDEX "requirements_assignedToId_idx" ON "requirements"("assignedToId");

-- CreateIndex
CREATE INDEX "requirements_parentId_idx" ON "requirements"("parentId");

-- CreateIndex
CREATE INDEX "requirement_versions_requirementId_idx" ON "requirement_versions"("requirementId");

-- CreateIndex
CREATE INDEX "requirement_versions_createdById_idx" ON "requirement_versions"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "requirement_versions_requirementId_versionNumber_key" ON "requirement_versions"("requirementId", "versionNumber");

-- CreateIndex
CREATE INDEX "requirement_tasks_requirementId_idx" ON "requirement_tasks"("requirementId");

-- CreateIndex
CREATE INDEX "requirement_tasks_taskId_idx" ON "requirement_tasks"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "requirement_tasks_requirementId_taskId_key" ON "requirement_tasks"("requirementId", "taskId");

-- CreateIndex
CREATE INDEX "requirement_comments_requirementId_idx" ON "requirement_comments"("requirementId");

-- CreateIndex
CREATE INDEX "requirement_comments_userId_idx" ON "requirement_comments"("userId");

-- CreateIndex
CREATE INDEX "requirement_attachments_requirementId_idx" ON "requirement_attachments"("requirementId");

-- CreateIndex
CREATE INDEX "requirement_attachments_uploaderId_idx" ON "requirement_attachments"("uploaderId");

-- CreateIndex
CREATE INDEX "requirement_tags_requirementId_idx" ON "requirement_tags"("requirementId");

-- CreateIndex
CREATE INDEX "requirement_tags_tagId_idx" ON "requirement_tags"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "requirement_tags_requirementId_tagId_key" ON "requirement_tags"("requirementId", "tagId");
