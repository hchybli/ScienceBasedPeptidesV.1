-- Baseline migration to reconcile production DB drift.
-- This migration captures tables that exist in the database but were not in migration history.
-- It should be marked as applied via `prisma migrate resolve --applied ...` (do not run against a DB that already has these tables).

-- CreateTable
CREATE TABLE "marketing_events" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "source" TEXT,
    "path" TEXT,
    "session_key" TEXT,
    "created_at" BIGINT NOT NULL,

    CONSTRAINT "marketing_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_tags" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "created_at" BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()))::bigint,

    CONSTRAINT "customer_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_notes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "author_user_id" TEXT,
    "created_at" BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()))::bigint,
    "updated_at" BIGINT,

    CONSTRAINT "customer_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_status" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "updated_at" BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()))::bigint,
    "updated_by" TEXT,

    CONSTRAINT "customer_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_tags_user_id_tag_key" ON "customer_tags"("user_id", "tag");

-- CreateIndex
CREATE INDEX "customer_tags_user_id_idx" ON "customer_tags"("user_id");

-- CreateIndex
CREATE INDEX "customer_tags_tag_idx" ON "customer_tags"("tag");

-- CreateIndex
CREATE INDEX "customer_notes_user_id_idx" ON "customer_notes"("user_id");

-- CreateIndex
CREATE INDEX "customer_notes_created_at_idx" ON "customer_notes"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "customer_status_user_id_key" ON "customer_status"("user_id");

-- CreateIndex
CREATE INDEX "customer_status_status_idx" ON "customer_status"("status");

