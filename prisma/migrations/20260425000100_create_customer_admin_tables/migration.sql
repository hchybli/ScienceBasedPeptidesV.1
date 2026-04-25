-- Create customer admin tables (safe on existing DBs).
-- Uses IF NOT EXISTS to support environments where tables were created via `db push`.

CREATE TABLE IF NOT EXISTS "customer_tags" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "created_at" BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()))::bigint,
    CONSTRAINT "customer_tags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "customer_notes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "author_user_id" TEXT,
    "created_at" BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()))::bigint,
    "updated_at" BIGINT,
    CONSTRAINT "customer_notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "customer_status" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "updated_at" BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()))::bigint,
    "updated_by" TEXT,
    CONSTRAINT "customer_status_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "customer_tags_user_id_tag_key" ON "customer_tags"("user_id", "tag");
CREATE INDEX IF NOT EXISTS "customer_tags_user_id_idx" ON "customer_tags"("user_id");
CREATE INDEX IF NOT EXISTS "customer_tags_tag_idx" ON "customer_tags"("tag");

CREATE INDEX IF NOT EXISTS "customer_notes_user_id_idx" ON "customer_notes"("user_id");
CREATE INDEX IF NOT EXISTS "customer_notes_created_at_idx" ON "customer_notes"("created_at");

CREATE UNIQUE INDEX IF NOT EXISTS "customer_status_user_id_key" ON "customer_status"("user_id");
CREATE INDEX IF NOT EXISTS "customer_status_status_idx" ON "customer_status"("status");

