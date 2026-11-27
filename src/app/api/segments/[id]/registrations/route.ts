import crypto from "node:crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withDbContext, writeAuditLog } from "@/lib/db";
import { logger } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";
import { guardRequest, jsonResponse } from "@/lib/security/guards";
import { segmentRegistrationSchema, uuidSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

function generateTicketCode(): string {
  return `MCPIC-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

/**
 * GET /api/segments/[id]/registrations — Admin only.
 */
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
      const segRes = await client.query(
        `SELECT s.id, s.name, s.registration_open, s.registration_deadline,
                s.max_participants, s.is_team_based, s.max_team_size,
                e.name AS event_name, e.id AS event_id
         FROM segments s
         JOIN events e ON e.id = s.event_id
         WHERE s.id = $1 LIMIT 1`,
        [parsedId.data]
      );
      const segment = segRes.rows[0];
      if (!segment) return null;

      const regRes = await client.query(
        `SELECT id, ticket_code, segment_id, user_id, participant_name, email, phone,
                institution, class_grade, team_name, team_members, status, created_at
         FROM segment_registrations
         WHERE segment_id = $1
         ORDER BY created_at DESC`,
        [parsedId.data]
      );

      return { segment, registrations: regRes.rows };
    });

    if (!result) {
      return jsonResponse(req, { error: "Segment not found" }, { status: 404 });
    }

    return jsonResponse(req, result);
  } catch (err) {
    logger.error("Failed to fetch segment registrations", { error: err });
    return jsonResponse(req, { error: "Failed to load registrations" }, { status: 500 });
  }
}

/**
 * POST /api/segments/[id]/registrations — Public or authenticated participant registration.
 * Enforces registration_open, deadline, capacity, and duplicate email checks atomically.
 */
export async function POST(
  req: Request,
  context: { params: { id: string } }
) {
  const guard = await guardRequest(req, {
    auth: "none",
    rateLimit: "write",
    csrf: true,
  });
  if (!guard.ok) return guard.response;

  const parsedId = uuidSchema.safeParse(context.params.id);
  if (!parsedId.success) {
    return jsonResponse(req, { error: "Invalid segment ID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = segmentRegistrationSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      req,
      { error: parsed.error.issues[0]?.message || "Invalid registration details" },
      { status: 400 }
    );
  }

  const session = await getServerSession(authOptions).catch(() => null);
  const userId = session?.user?.id ?? null;
  const d = parsed.data;

  try {
    const outcome = await withDbContext({ role: "system" }, async (client) => {
      // Lock the segment row to prevent concurrent overbooking past max_participants
      const segRes = await client.query<{
        id: string;
        name: string;
        registration_open: boolean;
        registration_deadline: Date | null;
        max_participants: number | null;
        is_team_based: boolean;
      }>(
        `SELECT id, name, registration_open, registration_deadline, max_participants, is_team_based
         FROM segments
         WHERE id = $1
         FOR UPDATE`,
        [parsedId.data]
      );

      const segment = segRes.rows[0];
      if (!segment) return { error: "NOT_FOUND" as const };
      if (!segment.registration_open) return { error: "CLOSED" as const };
      if (segment.registration_deadline && new Date() > new Date(segment.registration_deadline)) {
        return { error: "DEADLINE_PASSED" as const };
      }

      if (segment.is_team_based && !d.teamName) {
        return { error: "TEAM_REQUIRED" as const };
      }

      if (segment.max_participants !== null) {
        const countRes = await client.query<{ count: number }>(
          `SELECT COUNT(*)::int AS count
           FROM segment_registrations
           WHERE segment_id = $1 AND status = 'confirmed'`,
          [segment.id]
        );
        if ((countRes.rows[0]?.count ?? 0) >= segment.max_participants) {
          return { error: "FULL" as const };
        }
      }

      const dupRes = await client.query(
        `SELECT id FROM segment_registrations
         WHERE segment_id = $1 AND email = $2 AND status = 'confirmed'
         LIMIT 1`,
        [segment.id, d.email]
      );
      if (dupRes.rowCount && dupRes.rowCount > 0) {
        return { error: "DUPLICATE" as const };
      }

      const ticketCode = generateTicketCode();
      const inserted = await client.query(
        `INSERT INTO segment_registrations
           (ticket_code, segment_id, user_id, participant_name, email, phone,
            institution, class_grade, team_name, team_members)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, ticket_code, segment_id, participant_name, email, institution,
                   class_grade, team_name, status, created_at`,
        [
          ticketCode,
          segment.id,
          userId,
          d.participantName,
          d.email,
          d.phone,
          d.institution,
          d.classGrade,
          d.teamName || null,
          d.teamMembers || null,
        ]
      );

      await writeAuditLog(client, {
        actorId: userId,
        action: "registration.created",
        resourceType: "segment_registration",
        resourceId: inserted.rows[0].id,
        metadata: { segmentId: segment.id, ticketCode },
      });

      await createNotification(
        {
          audience: "admins",
          category: "registration",
          title: `New Segment Registration: ${segment.name}`,
          body: `${d.participantName} (${d.institution}) registered — Ticket ${ticketCode}.`,
          link: `/dashboard/segment-registrations/${segment.id}`,
          createdBy: userId,
        },
        client
      );

      if (userId) {
        await createNotification(
          {
            audience: "user",
            targetUserId: userId,
            category: "registration",
            title: `Registration Confirmed: ${segment.name}`,
            body: `Your seat is confirmed! Ticket code: ${ticketCode}.`,
            link: "/dashboard/my-registrations",
          },
          client
        );
      }

      return { data: inserted.rows[0] };
    });

    if ("error" in outcome) {
      const errorMap = {
        NOT_FOUND: { msg: "Segment not found.", status: 404 },
        CLOSED: { msg: "Registration for this segment is currently closed.", status: 403 },
        DEADLINE_PASSED: { msg: "The registration deadline has passed.", status: 403 },
        TEAM_REQUIRED: { msg: "Team name is required for team-based segments.", status: 400 },
        FULL: { msg: "This segment has reached maximum participant capacity.", status: 409 },
        DUPLICATE: { msg: "This email is already registered for this segment.", status: 409 },
      };
      const mapped = errorMap[outcome.error];
      return jsonResponse(req, { error: mapped.msg }, { status: mapped.status });
    }

    return jsonResponse(req, outcome.data, { status: 201 });
  } catch (err) {
    logger.error("Segment registration failed", { error: err });
    return jsonResponse(req, { error: "Registration failed" }, { status: 500 });
  }
}
