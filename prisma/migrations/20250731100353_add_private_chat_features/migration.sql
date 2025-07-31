-- CreateTable
CREATE TABLE "private_conversations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "participant1Id" TEXT NOT NULL,
    "participant2Id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "lastMessageAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "private_conversations_participant1Id_fkey" FOREIGN KEY ("participant1Id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "private_conversations_participant2Id_fkey" FOREIGN KEY ("participant2Id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "private_conversations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "private_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'TEXT',
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "replyToId" TEXT,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" DATETIME,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "private_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "private_conversations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "private_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "private_messages_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "private_messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "private_messages" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "private_message_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "private_message_notifications_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "private_messages" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "private_message_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "private_conversations_participant1Id_idx" ON "private_conversations"("participant1Id");

-- CreateIndex
CREATE INDEX "private_conversations_participant2Id_idx" ON "private_conversations"("participant2Id");

-- CreateIndex
CREATE INDEX "private_conversations_projectId_idx" ON "private_conversations"("projectId");

-- CreateIndex
CREATE INDEX "private_conversations_lastMessageAt_idx" ON "private_conversations"("lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "private_conversations_participant1Id_participant2Id_projectId_key" ON "private_conversations"("participant1Id", "participant2Id", "projectId");

-- CreateIndex
CREATE INDEX "private_messages_conversationId_idx" ON "private_messages"("conversationId");

-- CreateIndex
CREATE INDEX "private_messages_senderId_idx" ON "private_messages"("senderId");

-- CreateIndex
CREATE INDEX "private_messages_receiverId_idx" ON "private_messages"("receiverId");

-- CreateIndex
CREATE INDEX "private_messages_replyToId_idx" ON "private_messages"("replyToId");

-- CreateIndex
CREATE INDEX "private_messages_createdAt_idx" ON "private_messages"("createdAt");

-- CreateIndex
CREATE INDEX "private_messages_isRead_idx" ON "private_messages"("isRead");

-- CreateIndex
CREATE INDEX "private_message_notifications_messageId_idx" ON "private_message_notifications"("messageId");

-- CreateIndex
CREATE INDEX "private_message_notifications_userId_idx" ON "private_message_notifications"("userId");

-- CreateIndex
CREATE INDEX "private_message_notifications_isRead_idx" ON "private_message_notifications"("isRead");

-- CreateIndex
CREATE UNIQUE INDEX "private_message_notifications_messageId_userId_key" ON "private_message_notifications"("messageId", "userId");
