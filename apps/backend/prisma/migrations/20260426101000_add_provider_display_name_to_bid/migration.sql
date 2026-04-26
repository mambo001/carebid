-- AddProviderDisplayName
ALTER TABLE "Bid" ADD COLUMN "providerDisplayName" TEXT NOT NULL DEFAULT '';

-- Backfill existing rows from the provider profile snapshot
UPDATE "Bid" AS b
SET "providerDisplayName" = p."displayName"
FROM "Provider" AS p
WHERE b."providerId" = p."id";
