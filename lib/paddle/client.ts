import { initializePaddle, type Paddle } from "@paddle/paddle-js";

// Paddle.js should only ever be initialized once per page — cache the
// promise so repeat calls (initial submit vs. a later re-bid) reuse it.
let paddlePromise: Promise<Paddle | undefined> | null = null;

/** Resolves to `undefined` if NEXT_PUBLIC_PADDLE_CLIENT_TOKEN isn't configured, so callers can show a friendly error instead of throwing. */
export function getPaddleInstance(): Promise<Paddle | undefined> {
  if (!paddlePromise) {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    paddlePromise = token
      ? initializePaddle({
          token,
          environment: process.env.NEXT_PUBLIC_PADDLE_ENV === "production" ? "production" : "sandbox",
        })
      : Promise.resolve(undefined);
  }
  return paddlePromise;
}
