-- Partner roles for 2026: MOSRAC convenes, Nhimbe Trust is technical partner, ZITF hosts.
UPDATE "Partner" SET "tier" = 'CONVENOR', "caption" = COALESCE("caption", 'Convenor') WHERE "name" = 'MOSRAC Zimbabwe';
UPDATE "Partner" SET "tier" = 'TECHNICAL_PARTNER', "caption" = COALESCE("caption", 'Technical partner'), "url" = COALESCE("url", 'https://www.nhimbe.org') WHERE "name" = 'Nhimbe Trust';
