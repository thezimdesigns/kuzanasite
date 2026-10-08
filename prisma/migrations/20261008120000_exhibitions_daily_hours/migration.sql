-- KUZANA Exhibitions: open every day 7-10 October, 08:00-17:00 Bulawayo time (ZITF hours).
UPDATE "Event"
SET "startsAt" = '2026-10-07 06:00:00', "endsAt" = '2026-10-10 15:00:00', "timeTbc" = false, "dailyHours" = true
WHERE "slug" = 'kuzana-exhibitions' AND "dailyHours" = false;
