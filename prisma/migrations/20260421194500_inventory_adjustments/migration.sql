-- CreateTable
CREATE TABLE "inventory_adjustments" (
  "id" TEXT NOT NULL,
  "variant_id" TEXT NOT NULL,
  "delta" INTEGER NOT NULL,
  "reason" TEXT,
  "created_at" BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()))::bigint,

  CONSTRAINT "inventory_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inventory_adjustments_variant_id_created_at_idx" ON "inventory_adjustments" ("variant_id", "created_at" DESC);

