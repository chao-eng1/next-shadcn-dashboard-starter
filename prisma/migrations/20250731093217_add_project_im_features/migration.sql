-- CreateTable
CREATE TABLE "project_chats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "project_chats_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "project_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'TEXT',
    "chatId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "replyToId" TEXT,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" DATETIME,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "project_messages_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "project_chats" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "project_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "project_messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "project_messages" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "message_reads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "message_reads_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "project_messages" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "message_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_online_status" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPage" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_online_status_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "project_member_online" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "project_member_online_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "project_member_online_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "message_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "message_notifications_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "project_messages" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "message_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "project_chats_projectId_key" ON "project_chats"("projectId");

-- CreateIndex
CREATE INDEX "project_chats_projectId_idx" ON "project_chats"("projectId");

-- CreateIndex
CREATE INDEX "project_messages_chatId_idx" ON "project_messages"("chatId");

-- CreateIndex
CREATE INDEX "project_messages_senderId_idx" ON "project_messages"("senderId");

-- CreateIndex
CREATE INDEX "project_messages_replyToId_idx" ON "project_messages"("replyToId");

-- CreateIndex
CREATE INDEX "project_messages_createdAt_idx" ON "project_messages"("createdAt");

-- CreateIndex
CREATE INDEX "message_reads_messageId_idx" ON "message_reads"("messageId");

-- CreateIndex
CREATE INDEX "message_reads_userId_idx" ON "message_reads"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "message_reads_messageId_userId_key" ON "message_reads"("messageId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_online_status_userId_key" ON "user_online_status"("userId");

-- CreateIndex
CREATE INDEX "user_online_status_userId_idx" ON "user_online_status"("userId");

-- CreateIndex
CREATE INDEX "user_online_status_isOnline_idx" ON "user_online_status"("isOnline");

-- CreateIndex
CREATE INDEX "project_member_online_projectId_idx" ON "project_member_online"("projectId");

-- CreateIndex
CREATE INDEX "project_member_online_userId_idx" ON "project_member_online"("userId");

-- CreateIndex
CREATE INDEX "project_member_online_isOnline_idx" ON "project_member_online"("isOnline");

-- CreateIndex
CREATE UNIQUE INDEX "project_member_online_projectId_userId_key" ON "project_member_online"("projectId", "userId");

-- CreateIndex
CREATE INDEX "message_notifications_messageId_idx" ON "message_notifications"("messageId");

-- CreateIndex
CREATE INDEX "message_notifications_userId_idx" ON "message_notifications"("userId");

-- CreateIndex
CREATE INDEX "message_notifications_isRead_idx" ON "message_notifications"("isRead");

-- CreateIndex
CREATE UNIQUE INDEX "message_notifications_messageId_userId_key" ON "message_notifications"("messageId", "userId");
