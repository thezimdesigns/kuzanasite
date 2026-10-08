/**
 * First published daily figures (Day 1, Wed 7 Oct 2026). Applied once by the
 * seed; later days are entered in Admin → Daily figures.
 */
import type { PrismaClient } from "../../lib/generated/prisma/client";

const FLAG = "content.stats-2026-10-07.v1";

export async function applyDayOneFigures(db: PrismaClient) {
  if (await db.siteSetting.findUnique({ where: { key: FLAG } })) return;
  const day = new Date("2026-10-07T00:00:00Z");
  if (!(await db.dailyReport.findUnique({ where: { day } }))) {
    await db.dailyReport.create({
      data: {
        day,
        publishStatus: "PUBLISHED",
        groups: [
          {
            title: "Exhibitors",
            showTotal: true,
            items: [
              { label: "Sport", value: 58 },
              { label: "Arts", value: 70 },
              { label: "Generic", value: 10 },
            ],
          },
          {
            title: "Conference delegates",
            showTotal: false,
            items: [
              { label: "Morning session", value: 448 },
              { label: "Afternoon session", value: 183 },
            ],
          },
        ],
      },
    });
  }
  await db.siteSetting.create({ data: { key: FLAG, value: new Date().toISOString() } });
}
