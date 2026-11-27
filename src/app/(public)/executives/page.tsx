import ExecutivesClient from "@/components/PublicPages/ExecutivesClient";
import { queryPublic } from "@/lib/db";
import type { ExecutiveMemberRecord } from "@/types/models";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Executives",
};

function toIso(val: unknown): string {
  if (val instanceof Date) return val.toISOString();
  return typeof val === "string" ? val : "";
}

export default async function ExecutivesPage() {
  const rows = await queryPublic(
    `SELECT id, panel_year, name, post, image_url, display_order, created_at
     FROM executive_members
     ORDER BY panel_year DESC, display_order ASC, created_at ASC`
  ).catch(() => []);

  const initialMembers: ExecutiveMemberRecord[] = rows.map((m) => ({
    id: String(m.id),
    panel_year: String(m.panel_year),
    name: String(m.name),
    post: String(m.post),
    image_url: String(m.image_url),
    display_order: Number(m.display_order ?? 0),
    created_at: toIso(m.created_at),
  }));

  return <ExecutivesClient initialMembers={initialMembers} />;
}
