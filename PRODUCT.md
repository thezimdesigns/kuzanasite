# KUZANA SCEEZ: product context

## What it is

KUZANA SCEEZ (Sport & Creative Economy Expo of Zimbabwe) is a yearly expo in Bulawayo that connects sport and creative talent with investors, brands, government and audiences. #FromTalentToGDP. Convened by the Ministry of Sport, Recreation, Arts and Culture, hosted at ZITF, with Nhimbe Trust as technical partner. First edition 7–11 October 2026; next 6–10 October 2027.

www.kuzana.org.zw is the year-round home of the platform:

- **Event week ("live" phase):** live programme, today, exhibitors, live board, Q&A, daily figures.
- **Between editions:** about 70% ongoing activity (participant stories, editorial series such as _Signal_, updates, taking part in the next edition) and about 30% the last edition as the record (review page, programme, speeches, numbers).

The phase is derived from the current edition's dates (`getSiteState()` in `lib/edition.ts`).

## Audiences

- Visitors and the Bulawayo public, mostly on phones and often on patchy venue networks.
- Exhibitors and SMEs in the creative and sport economy. Applications run on the separate **KUZANA Portal** (portal.kuzana.org.zw, also kuzana.org.zw/portal).
- Speakers, artists, athletes, federations, sponsors and investors.
- Government, partners and media: they need credible records (speeches, figures, coverage).

## Surfaces and modes

| Surface                                 | Mode       | Success looks like                                     |
| --------------------------------------- | ---------- | ------------------------------------------------------ |
| Homepage (live)                         | Operate    | Find what's on now and get there                       |
| Homepage (between editions), /take-part | Persuade   | Read a story, register interest, save the date         |
| /stories, /series/*, story posts        | Read       | Read to the end, follow the series                     |
| /archive/[year]                         | Experience | Sense the scale of the edition and dig into its record |
| Programme, events, exhibitors           | Operate    | Find details fast on a phone                           |
| Admin                                   | Operate    | Capture and publish quickly, under pressure            |

## Voice

Plain, warm and confident; British spelling; no hype words; numbers over adjectives. Never invent figures or claims. Use only published data.

## Visual system (incumbent, extend; do not replace)

- Tokens: green-900/950 (#00512D family), orange / orange-bright accent, gold-light, cream backgrounds. Bricolage Grotesque (headings) and Open Sans (body).
- Components: poster-led cards (4:5 posters, branded tiles when there is no image), dark green bands for emphasis, the ivory pattern for page headers, one radius scale through `--radius-card`, `--radius-control` and `--radius-badge`.
- Icons: lucide-react, already a project dependency.
- Motion: subtle hero line rises and card lifts, all respecting reduced motion.
