import nodemailer from "nodemailer";
import { getEnv } from "./env";
import { logger } from "./logger";

interface MailPayload {
  to: string;
  subject: string;
  text: string;
}

export async function sendMail(payload: MailPayload): Promise<{ delivered: boolean }> {
  const { smtp, isProd } = getEnv();

  if (!smtp.host || !smtp.user || !smtp.pass) {
    logger.warn("SMTP not configured; email delivery skipped", {
      subject: payload.subject,
      recipientDomain: payload.to.split("@")[1] ?? "unknown",
      devMode: !isProd,
    });
    return { delivered: false };
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });

  await transporter.sendMail({
    from: smtp.from,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
  });

  return { delivered: true };
}
