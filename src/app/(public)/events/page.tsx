import EventsClient from "@/components/PublicPages/EventsClient";
import { queryPublic } from "@/lib/db";
import type { EventRecord } from "@/types/models";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Events",
};

function toIso(val: unknown): string {
  if (val instanceof Date) return val.toISOString();
  return typeof val === "string" ? val : "";
}

export default async function EventsPage() {
  const rows = await queryPublic(
    `SELECT id, slug, name, description, image_url, start_date, end_date,
            created_by, created_by_name, created_at, updated_at
     FROM events
     ORDER BY created_at DESC`
  ).catch(() => []);

  const initialEvents: EventRecord[] = rows.map((e) => ({
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

  return <EventsClient initialEvents={initialEvents} />;
}
