import { NextResponse } from "next/server";
import { withDbContext, writeAuditLog } from "@/lib/db";
import { logger } from "@/lib/logger";
import { applyCorsHeaders } from "@/lib/security/cors";
import { guardRequest, jsonResponse } from "@/lib/security/guards";
import { slugify } from "@/lib/security/sanitize";
import { uuidSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

/**
 * Prevents CSV Formula Injection (DDE / Excel / Sheets formula execution)
 * by prefixing cells beginning with =, +, -, @, tab, or carriage return.
 */
function sanitizeCsvCell(value: unknown): string {
  const str = String(value ?? "");
  const neutralized = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${neutralized.replace(/"/g, '""')}"`;
}

export async function GET(
  req: Request,
  context: { params: { id: string } }
) {
  const guard = await guardRequest(req, { auth: "admin", csrf: false });
  if (!guard.ok) return guard.response;

  const parsedId = uuidSchema.safeParse(context.params.id);
  if (!parsedId.success) {
    return jsonResponse(req, { error: "Invalid segment ID" }, { status: 400 });
  }

  try {
    const result = await withDbContext(guard.dbCtx, async (client) => {
      const segRes = await client.query<{ name: string; event_name: string }>(
        `SELECT s.name, e.name AS event_name
         FROM segments s
         JOIN events e ON e.id = s.event_id
         WHERE s.id = $1 LIMIT 1`,
        [parsedId.data]
      );
      const seg = segRes.rows[0];
      if (!seg) return null;

      const regRes = await client.query<{
        ticket_code: string;
        participant_name: string;
        email: string;
        phone: string;
        institution: string;
        class_grade: string;
        team_name: string | null;
        team_members: string | null;
        status: string;
        created_at: Date;
      }>(
        `SELECT ticket_code, participant_name, email, phone, institution,
                class_grade, team_name, team_members, status, created_at
         FROM segment_registrations
         WHERE segment_id = $1
         ORDER BY created_at ASC`,
        [parsedId.data]
      );

      await writeAuditLog(client, {
        actorId: guard.session!.user.id,
        action: "registration.csv_exported",
        resourceType: "segment",
        resourceId: parsedId.data,
        metadata: { count: regRes.rowCount ?? 0 },
      });

      return { segment: seg, rows: regRes.rows };
    });

    if (!result) {
      return jsonResponse(req, { error: "Segment not found" }, { status: 404 });
    }

    const headers = [
      "Ticket Code",
      "Participant Name",
      "Email",
      "Phone",
      "Institution",
      "Class/Grade",
      "Team Name",
      "Team Members",
      "Status",
      "Registered At (UTC)",
    ];

    const lines = [
      headers.map(sanitizeCsvCell).join(","),
      ...result.rows.map((r) =>
        [
          r.ticket_code,
          r.participant_name,
          r.email,
          r.phone,
          r.institution,
          r.class_grade,
          r.team_name ?? "",
          r.team_members ?? "",
          r.status,
          new Date(r.created_at).toISOString(),
        ]
          .map(sanitizeCsvCell)
          .join(",")
      ),
    ];

    const csv = `\uFEFF${lines.join("\r\n")}`;
    const filename = `${slugify(result.segment.event_name)}-${slugify(result.segment.name)}-registrations.csv`;

    const res = new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store",
      },
    });
    return applyCorsHeaders(req, res);
  } catch (err) {
    logger.error("CSV export failed", { error: err });
    return jsonResponse(req, { error: "Failed to export CSV" }, { status: 500 });
  }
}
