import { Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../lib/prisma.js";

const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET || "";
const WEBHOOK_MAX_SKEW_MS = 5 * 60 * 1000;
const processedWebhookEvents = new Map<string, number>();
const WEBHOOK_DEDUP_TTL_MS = 24 * 60 * 60 * 1000;

function cleanupProcessedWebhookEvents(now: number): void {
  for (const [eventId, seenAt] of processedWebhookEvents) {
    if (now - seenAt > WEBHOOK_DEDUP_TTL_MS) {
      processedWebhookEvents.delete(eventId);
    }
  }
}

function verifyPaddleSignature(rawBody: Buffer, signatureHeader: string): boolean {
  if (!PADDLE_WEBHOOK_SECRET) return false;
  const parts = signatureHeader.split(";").reduce((acc, part) => {
    const [k, v] = part.split("=");
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {} as Record<string, string>);
  const ts = parts.ts;
  const h1 = parts.h1;
  if (!ts || !h1) return false;
  if (!/^\d+$/.test(ts)) return false;
  if (!/^[a-f0-9]+$/i.test(h1) || h1.length !== 64) return false;

  const timestampMs = Number(ts) * 1000;
  if (!Number.isFinite(timestampMs)) return false;
  if (Math.abs(Date.now() - timestampMs) > WEBHOOK_MAX_SKEW_MS) return false;

  const signedPayload = `${ts}:${rawBody.toString("utf8")}`;
  const expected = crypto.createHmac("sha256", PADDLE_WEBHOOK_SECRET).update(signedPayload).digest("hex");
  const receivedBuffer = Buffer.from(h1, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (receivedBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

export async function handlePaddleWebhook(req: Request, res: Response): Promise<void> {
  const rawBody = req.body;
  if (!Buffer.isBuffer(rawBody)) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const signature = req.headers["paddle-signature"] as string;
  if (!signature || !verifyPaddleSignature(rawBody, signature)) {
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  let payload: {
    event_type?: string;
    data?: {
      id?: string;
      custom_data?: { user_id?: string };
      current_billing_period?: { ends_at?: string };
      next_billed_at?: string;
      status?: string;
    };
  };
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    res.status(400).json({ error: "Invalid JSON" });
    return;
  }

  const eventType = payload.event_type;
  const data = payload.data;
  if (!eventType || !data) {
    res.status(200).json({ received: true });
    return;
  }

  const eventId = data.id;
  if (eventId) {
    const now = Date.now();
    cleanupProcessedWebhookEvents(now);
    if (processedWebhookEvents.has(eventId)) {
      res.status(200).json({ received: true, deduplicated: true });
      return;
    }
    processedWebhookEvents.set(eventId, now);
  }

  const userId = data.custom_data?.user_id;
  if (!userId) {
    console.warn("Paddle webhook: no user_id in custom_data", eventType, data.id);
    res.status(200).json({ received: true });
    return;
  }

  if (eventType === "subscription.created" || eventType === "subscription.updated" || eventType === "subscription.activated" || eventType === "subscription.resumed") {
    const endsAt = data.current_billing_period?.ends_at || data.next_billed_at;
    if (endsAt) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { subscriptionExpiresAt: new Date(endsAt) },
        });
        console.log(`Paddle: set subscriptionExpiresAt for user ${userId} until ${endsAt}`);
      } catch (e) {
        console.error("Paddle webhook: failed to update user", userId, e);
      }
    }
  } else if (eventType === "subscription.canceled" || eventType === "subscription.paused") {
    const endsAt = data.current_billing_period?.ends_at ?? null;
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { subscriptionExpiresAt: endsAt ? new Date(endsAt) : null },
      });
      console.log(`Paddle: cleared or set subscriptionExpiresAt for user ${userId}`);
    } catch (e) {
      console.error("Paddle webhook: failed to update user", userId, e);
    }
  }

  res.status(200).json({ received: true });
}
