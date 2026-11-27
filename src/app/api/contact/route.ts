import { withDbContext } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { sendMail } from "@/lib/mailer";
import { createNotification } from "@/lib/notifications";
import { sha256Hex } from "@/lib/security/crypto";
import { guardRequest, jsonResponse } from "@/lib/security/guards";
import { contactSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const guard = await guardRequest(req, {
    auth: "none",
    rateLimit: "contact",
    csrf: true,
  });
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      req,
      { error: parsed.error.issues[0]?.message || "Invalid contact form data" },
      { status: 400 }
    );
  }

  const { name, email, message } = parsed.data;
  const ipHash = sha256Hex(guard.ip);

  try {
    await withDbContext(guard.dbCtx, async (client) => {
      await client.query(
        `INSERT INTO contact_messages (name, email, message, ip_hash)
         VALUES ($1, $2, $3, $4)`,
        [name, email, message, ipHash]
      );
    });

    await createNotification({
      audience: "admins",
      category: "message",
      title: `New Contact Message from ${name}`,
      body: message.length > 140 ? `${message.slice(0, 137)}...` : message,
      link: "/dashboard/messages",
    });

    const { smtp } = getEnv();
    await sendMail({
      to: smtp.contactReceiver,
      subject: `[MCPIC Contact] Message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    return jsonResponse(req, { message: "Message received. Thank you for reaching out!" }, { status: 201 });
  } catch (err) {
    logger.error("Failed to handle contact submission", { error: err });
    return jsonResponse(req, { error: "Failed to send message" }, { status: 500 });
  }
}
