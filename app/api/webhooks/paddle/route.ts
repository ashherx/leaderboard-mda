import { NextResponse } from "next/server";
import { EventName } from "@paddle/paddle-node-sdk";
import { getPaddleClient } from "@/lib/paddle/server";
import { completePaddlePayment } from "@/lib/checkout";

/**
 * Paddle calls this once a checkout transaction is fully paid — it's the
 * only place a real (non-stub) payment actually publishes a listing (see
 * completePaddlePayment in lib/checkout.ts). Configure this URL as a
 * notification destination in the Paddle dashboard (sandbox for now):
 * Developer Tools > Notifications, subscribed to `transaction.completed`.
 */
export async function POST(request: Request) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("Paddle webhook received but PADDLE_WEBHOOK_SECRET is not set.");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = request.headers.get("paddle-signature") ?? "";
  // Signature verification needs the exact raw bytes Paddle signed — must
  // read as text, never request.json(), or the HMAC won't match.
  const rawBody = await request.text();

  let event;
  try {
    event = await getPaddleClient().webhooks.unmarshal(rawBody, secret, signature);
  } catch (err) {
    console.error("Paddle webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event?.eventType === EventName.TransactionCompleted) {
    await completePaddlePayment(event.data.id);
  }

  // Paddle retries on non-2xx — always 200 once verified, even for event
  // types we don't act on, so it doesn't keep retrying those forever.
  return NextResponse.json({ ok: true });
}
