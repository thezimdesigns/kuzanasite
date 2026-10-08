-- Carry any single ticket price over into the new ticket list (one "Ticket" row per event).
INSERT INTO "EventTicket" ("id", "eventId", "name", "price", "url", "sortOrder", "createdAt", "updatedAt")
SELECT 'c' || substr(md5(random()::text || e."id"), 1, 24), e."id", 'Ticket', e."ticketPrice", NULL, 0, now(), now()
FROM "Event" e
WHERE e."ticketPrice" IS NOT NULL AND btrim(e."ticketPrice") <> ''
  AND NOT EXISTS (SELECT 1 FROM "EventTicket" t WHERE t."eventId" = e."id");
