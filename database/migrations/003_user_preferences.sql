ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "preferredDarkMode" BOOLEAN NOT NULL DEFAULT TRUE;
UPDATE "User" SET "preferredDarkMode" = TRUE WHERE "preferredDarkMode" IS NULL;
