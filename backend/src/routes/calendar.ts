import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

function toIcsDateTimeUTC(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(
    d.getUTCHours()
  )}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function escapeIcsText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function buildEventIcs(event: {
  id: string;
  title: string;
  date: string;
  time?: string | null;
  location?: string | null;
  description?: string | null;
  sourceUrl?: string | null;
}): string {
  // If time is missing, default to 19:00 local-ish; this matches typical "evening event" expectation.
  // We still produce a valid DTSTART/DTEND in UTC to maximize calendar compatibility.
  const start = new Date(`${event.date}T${event.time ?? "19:00"}:00`);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // 2h default duration
  const dtstamp = new Date();

  const uid = `${event.id}@event-newsletter.com`;
  const summary = escapeIcsText(event.title);
  const location = escapeIcsText(event.location ?? "");
  const descriptionParts = [event.description, event.sourceUrl].filter(Boolean) as string[];
  const description = escapeIcsText(descriptionParts.join("\n\n"));

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The Event Newsletter//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toIcsDateTimeUTC(dtstamp)}`,
    `DTSTART:${toIcsDateTimeUTC(start)}`,
    `DTEND:${toIcsDateTimeUTC(end)}`,
    `SUMMARY:${summary}`,
    location ? `LOCATION:${location}` : undefined,
    description ? `DESCRIPTION:${description}` : undefined,
    event.sourceUrl ? `URL:${escapeIcsText(event.sourceUrl)}` : undefined,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ]
    .filter(Boolean)
    .join("\r\n");
}

// Public: used from email template; no auth.
router.get("/events/:id.ics", async (req, res) => {
  try {
    const id = req.params.id;
    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        date: true,
        time: true,
        location: true,
        description: true,
        sourceUrl: true,
      },
    });
    if (!event) return res.status(404).send("Not found");

    const ics = buildEventIcs({
      id: event.id,
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      description: event.description,
      sourceUrl: event.sourceUrl,
    });

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=\"event-${event.id}.ics\"`);
    res.status(200).send(ics);
  } catch (e) {
    res.status(500).send("Internal server error");
  }
});

export { router as calendarRoutes };

