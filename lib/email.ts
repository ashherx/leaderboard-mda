import nodemailer from "nodemailer";

/**
 * Admin notification emails (new listing claimed, re-bid paid) - sent via
 * Gmail SMTP through nodemailer using an app password, not the Gmail API.
 * GMAIL_USER is both the SMTP login and the "from" address; FEEDBACK_EMAIL
 * is where notifications land (kept separate from GMAIL_USER since the
 * sending mailbox and the mailbox you actually read don't have to match).
 *
 * A missing/misconfigured env var here should never break a payment webhook
 * (see completeLemonSqueezyPayment in lib/checkout.ts, which is fire-and-
 * forget around this) - callers just get a rejected promise or a console
 * warning, nothing throws past this module.
 */

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return transporter;
}

/** Fire-and-forget: logs and swallows failures rather than throwing, so a broken mail config never breaks the caller (a payment webhook, an admin action, ...). */
export async function sendAdminNotification(subject: string, text: string): Promise<void> {
  const to = process.env.FEEDBACK_EMAIL;
  if (!to) {
    console.error("sendAdminNotification: FEEDBACK_EMAIL is not set - skipping email.");
    return;
  }

  const transport = getTransporter();
  if (!transport) {
    console.error("sendAdminNotification: GMAIL_USER/GMAIL_APP_PASSWORD not set - skipping email.");
    return;
  }

  try {
    await transport.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error("sendAdminNotification: failed to send email.", err);
  }
}
