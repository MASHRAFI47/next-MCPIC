import Banner from "@/components/HomePage/Banner";
import Marquee from "@/components/HomePage/Marquee";
import WhoWeAre from "@/components/HomePage/WhoWeAre";
import RecentEvents from "@/components/HomePage/RecentEvents";
import Achievements from "@/components/HomePage/Achievements";
import { queryPublic } from "@/lib/db";
import type { AchievementRecord, EventRecord } from "@/types/models";

export const dynamic = "force-dynamic";

function toIso(val: unknown): string {
  if (val instanceof Date) return val.toISOString();
  return typeof val === "string" ? val : "";
}

export default async function HomePage() {
  const [rawEvents, rawAchievements] = await Promise.all([
    queryPublic(
      `SELECT id, slug, name, description, image_url, start_date, end_date,
              created_by, created_by_name, created_at, updated_at
       FROM events
       ORDER BY created_at DESC
       LIMIT 3`
    ).catch(() => []),
    queryPublic(
      `SELECT id, title, tag, image_url, year, display_order, created_at
       FROM achievements
       ORDER BY display_order ASC, created_at DESC`
    ).catch(() => []),
  ]);

  const initialEvents: EventRecord[] = rawEvents.map((e) => ({
    id: String(e.id),
    slug: String(e.slug),
    name: String(e.name),
    description: String(e.description),
    image_url: String(e.image_url),
    start_date: toIso(e.start_date),
    end_date: toIso(e.end_date),
    created_by: e.created_by ? String(e.created_by) : null,
    created_by_name: String(e.created_by_name),
    created_at: toIso(e.created_at),
    updated_at: toIso(e.updated_at),
  }));

  const initialAchievements: AchievementRecord[] = rawAchievements.map((a) => ({
    id: String(a.id),
    title: String(a.title),
    tag: String(a.tag),
    image_url: String(a.image_url),
    year: a.year ? String(a.year) : null,
    display_order: Number(a.display_order ?? 0),
    created_at: toIso(a.created_at),
  }));

  return (
    <>
      <Banner />
      <Marquee />
      <WhoWeAre />
      <RecentEvents initialEvents={initialEvents} />
      <Achievements initialAchievements={initialAchievements} />
    </>
  );
}
