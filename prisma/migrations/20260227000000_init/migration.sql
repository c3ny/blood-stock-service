-- CreateEnum
CREATE TYPE "BloodType" AS ENUM ('A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG');

-- CreateTable
CREATE TABLE "stock" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "blood_type" "BloodType" NOT NULL,
    "quantity_a" INTEGER NOT NULL,
    "quantity_b" INTEGER NOT NULL,
    "quantity_ab" INTEGER NOT NULL,
    "quantity_o" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloodstock_movement" (
    "id" UUID NOT NULL,
    "stock_id" UUID NOT NULL,
    "movement" INTEGER NOT NULL,
    "quantity_before" INTEGER NOT NULL,
    "quantity_after" INTEGER NOT NULL,
    "action_by" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bloodstock_movement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "blood_type" "BloodType" NOT NULL,
    "entry_quantity" INTEGER NOT NULL,
    "exit_quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bloodstock_movement_stock_id_idx" ON "bloodstock_movement"("stock_id");

-- CreateIndex
CREATE INDEX "batch_company_id_idx" ON "batch"("company_id");

-- CreateIndex
CREATE INDEX "batch_blood_type_idx" ON "batch"("blood_type");

-- CreateIndex
CREATE UNIQUE INDEX "batch_company_id_code_key" ON "batch"("company_id", "code");

-- AddForeignKey
ALTER TABLE "bloodstock_movement" ADD CONSTRAINT "bloodstock_movement_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
