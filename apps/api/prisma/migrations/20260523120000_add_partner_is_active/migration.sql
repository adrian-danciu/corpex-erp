-- Add soft-active flag for partners. Existing partners remain usable.
ALTER TABLE "Partner" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
