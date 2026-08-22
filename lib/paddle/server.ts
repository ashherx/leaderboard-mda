import { Environment, Paddle } from "@paddle/paddle-node-sdk";

// Cached across invocations within the same server process - Paddle's own
// guidance is to reuse one client rather than construct it per request.
let client: Paddle | null = null;

export function getPaddleClient(): Paddle {
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) {
    throw new Error("PADDLE_API_KEY is not set - see .env.local.example.");
  }

  if (!client) {
    client = new Paddle(apiKey, {
      environment: process.env.NEXT_PUBLIC_PADDLE_ENV === "production" ? Environment.production : Environment.sandbox,
    });
  }
  return client;
}
