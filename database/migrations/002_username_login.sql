ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT;

UPDATE "User"
SET "username" = LOWER(REGEXP_REPLACE(COALESCE(NULLIF(SPLIT_PART("email", '@', 1), ''), 'user'), '[^a-zA-Z0-9_-]', '', 'g')) || '_' || SUBSTRING("id" FROM 1 FOR 6)
WHERE "username" IS NULL OR "username" = '';

ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
