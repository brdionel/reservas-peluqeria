-- CreateTable
CREATE TABLE "google_calendars" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "calendar_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "color_id" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_id" INTEGER,

    CONSTRAINT "google_calendars_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "google_calendars_calendar_id_key" ON "google_calendars"("calendar_id");

-- AddForeignKey
ALTER TABLE "google_calendars" ADD CONSTRAINT "google_calendars_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migrate existing google_event_id data to google_event_ids
-- First, add the new column
ALTER TABLE "bookings" ADD COLUMN "google_event_ids" TEXT;

-- Migrate existing data
UPDATE "bookings" 
SET "google_event_ids" = CASE 
    WHEN "google_event_id" IS NOT NULL THEN CONCAT('["', "google_event_id", '"]')
    ELSE NULL 
END;

-- Drop the old column
ALTER TABLE "bookings" DROP COLUMN "google_event_id";

-- Insert default calendar
INSERT INTO "google_calendars" ("name", "calendar_id", "email", "is_active", "is_primary", "description") 
VALUES ('Calendario Principal', 'brunovicente32@gmail.com', 'brunovicente32@gmail.com', true, true, 'Calendario principal del salón');
