import { prisma } from "../lib/prisma.js";
import { discoverEventsForUser } from "./events.js";
import { sendEmail } from "../services/email.js";

export async function getUserNewsletters(userId: string) {
  return prisma.newsletter.findMany({
    where: { userId },
    include: {
      events: {
        include: {
          event: true,
        },
        orderBy: {
          order: "asc",
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

const NEWSLETTER_LIMIT_PER_USER = parseInt(process.env.NEWSLETTER_LIMIT_PER_USER || "5", 10);

export async function generateNewsletter(
  userId: string,
  options?: { isScheduledRun?: boolean }
) {
  // Apply manual-generation limit only when user triggers generation (not for weekly scheduled run)
  if (!options?.isScheduledRun) {
    const count = await prisma.newsletter.count({
      where: { userId },
    });
    if (count >= NEWSLETTER_LIMIT_PER_USER) {
      throw new Error(
        "You've reached the limit of 5 newsletters. Contact support to request more."
      );
    }
  }

  // Discover events for user (will refresh profile if dirty)
  const { events, rawResponses } = await discoverEventsForUser(userId);

  console.log(
    `generateNewsletter: received ${events.length} events from discoverEventsForUser`
  );
  events.forEach((e, i) => {
    console.log(
      `  ${i + 1}. "${e.title}" (id: ${e.id}, sourceUrl: ${e.sourceUrl})`
    );
  });

  if (events.length === 0) {
    throw new Error("No events found for user");
  }

  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Generate HTML content
  const htmlContent = generateNewsletterHTML(user.name || user.email, events);

  // Deduplicate events by eventId within this newsletter to avoid unique constraint violations
  // But allow the same event to appear in different newsletters (events can be duplicated across weeks)
  const eventsToProcess = events.slice(0, 20);
  console.log(
    `Processing ${eventsToProcess.length} events for newsletter (from ${events.length} total)`
  );

  const uniqueEvents = eventsToProcess.reduce((acc, event, index) => {
    // Check if we've already added this event to THIS newsletter
    const existing = acc.find((e: any) => e.eventId === event.id);
    if (!existing) {
      acc.push({
        eventId: event.id,
        order: index,
      });
    } else {
      console.log(
        `Skipping duplicate eventId in newsletter: "${event.title}" (id: ${event.id}, already at order ${existing.order})`
      );
    }
    return acc;
  }, [] as Array<{ eventId: string; order: number }>);

  console.log(
    `Creating newsletter with ${uniqueEvents.length} unique events (from ${eventsToProcess.length} processed)`
  );

  // Create newsletter
  const newsletter = await prisma.newsletter.create({
    data: {
      userId,
      subject: `Your Weekly Local Events (Next 30 Days) - ${new Date().toLocaleDateString()}`,
      htmlContent,
      events: {
        create: uniqueEvents,
      },
    },
    include: {
      events: {
        include: {
          event: true,
        },
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  return { newsletter, rawResponses };
}

export async function sendNewsletter(userId: string, newsletterId: string) {
  // Get newsletter
  const newsletter = await prisma.newsletter.findFirst({
    where: {
      id: newsletterId,
      userId,
    },
    include: {
      user: true,
      events: {
        include: {
          event: true,
        },
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  if (!newsletter) {
    throw new Error("Newsletter not found");
  }

  if (newsletter.sentAt) {
    throw new Error("This newsletter has already been sent.");
  }

  // Send email
  console.log("Sending newsletter email to:", newsletter.user.email);
  try {
    await sendEmail({
      to: newsletter.user.email,
      subject: newsletter.subject,
      html: newsletter.htmlContent,
    });
    console.log("Email sent successfully to:", newsletter.user.email);
  } catch (error) {
    console.error("Failed to send email:", error);
    // Don't update sentAt if email failed
    throw error;
  }

  // Update newsletter
  await prisma.newsletter.update({
    where: { id: newsletterId },
    data: { sentAt: new Date() },
  });

  console.log("Newsletter marked as sent");

  return { success: true };
}

const CATEGORY_COLORS = [
  "#000080", "#008000", "#800080", "#800000", "#008080",
  "#808000", "#004080", "#804000", "#408080", "#808080",
];

function getCategoryColor(category?: string | null): string {
  const key = (category?.trim() || "(uncategorized)").toLowerCase();
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash << 5) - hash + key.charCodeAt(i);
  const idx = Math.abs(hash) % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[idx];
}

/** Format date as "Fri, 13 May" (like on the website) */
function formatEventDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const weekday = d.toLocaleDateString("en-GB", { weekday: "short" });
  const day = d.getDate();
  const month = d.toLocaleDateString("en-GB", { month: "short" });
  return `${weekday}, ${day} ${month}`;
}

/** Build Google Calendar "Add to Calendar" URL for an all-day event (date only). */
function buildAddToCalendarUrl(event: { title: string; date: Date | string; time?: string | null; location?: string | null; description?: string | null; sourceUrl?: string | null }): string {
  const d = typeof event.date === "string" ? new Date(event.date) : event.date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const dateStr = `${y}${m}${day}`;
  let startStr: string;
  let endStr: string;
  if (event.time) {
    const [hours, minutes] = event.time.match(/\d{1,2}/g)?.map(Number) || [0, 0];
    const start = new Date(d);
    start.setHours(hours, minutes, 0, 0);
    const end = new Date(start);
    end.setHours(end.getHours() + 2, 0, 0, 0);
    startStr = start.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z/, "Z");
    endStr = end.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z/, "Z");
  } else {
    startStr = dateStr;
    endStr = dateStr;
  }
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${startStr}/${endStr}`,
    ...(event.location && { location: event.location }),
    ...((event.description || event.sourceUrl) && { details: [event.description, event.sourceUrl].filter(Boolean).join("\n\n") }),
  });
  return `https://www.google.com/calendar/render?${params.toString()}`;
}

function generateNewsletterHTML(userName: string, events: any[]): string {
  const eventsHTML = events
    .slice(0, 20)
    .map((event, index) => {
      const score =
        event.score !== null && event.score !== undefined ? event.score : null;
      const scoreColor =
        score !== null
          ? score >= 80
            ? "#28a745"
            : score >= 60
            ? "#ffc107"
            : "#dc3545"
          : "#6c757d";
      const categoryColor = getCategoryColor(event.category);
      const dateDisplay = formatEventDate(event.date);
      const addToCalendarUrl = buildAddToCalendarUrl({
        title: event.title,
        date: event.date,
        time: event.time,
        location: event.location,
        description: event.description,
        sourceUrl: event.sourceUrl,
      });

      const scoreBadge =
        score !== null
          ? `<td style="vertical-align: top; width: 60px; padding-left: 12px; text-align: center;"><div style="background-color: ${scoreColor}; color: white; border-radius: 12px; font-weight: bold; font-size: 14px; width: 56px; height: 28px; line-height: 28px; text-align: center;">${score}/100</div></td>`
          : "<td></td>";

      return `
    <div style="margin-bottom: 30px; padding: 20px; border: 1px solid #e0e0e0; border-left: 4px solid ${categoryColor}; border-radius: 8px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 10px;"><tr>
        <td style="vertical-align: top;"><h3 style="margin: 0; color: #333; font-size: 16px;">${index + 1}. ${event.title}</h3></td>
        ${scoreBadge}
      </tr></table>
      ${
        event.description
          ? `<p style="color: #666; margin: 0 0 10px 0;">${event.description}</p>`
          : ""
      }
      <div style="margin-top: 10px;">
        <p style="margin: 5px 0; color: #555;">
          <strong>📅 Date:</strong> ${dateDisplay}${event.time ? ` ${event.time}` : ""}
        </p>
        <p style="margin: 5px 0; color: #555;">
          <strong>📍 Location:</strong> ${event.location}
        </p>
        ${
          event.category
            ? `<p style="margin: 5px 0; color: #555;"><strong>🏷️ Category:</strong> ${event.category}</p>`
            : ""
        }
        <p style="margin-top: 12px;">
          <a href="${addToCalendarUrl}" style="display: inline-block; margin-right: 10px; padding: 8px 16px; background-color: #34a853; color: white; text-decoration: none; border-radius: 5px;">Add to Calendar</a>
          <a href="${event.sourceUrl}" style="display: inline-block; padding: 8px 16px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Learn More</a>
        </p>
      </div>
    </div>
  `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #007bff;">Your Weekly Local Events</h1>
        <p>Hi ${userName},</p>
        <p>Here are the local events we found for you in the next 30 days:</p>
        ${eventsHTML}
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
        <p style="color: #666; font-size: 12px;">
          You're receiving this because you signed up for local event updates.
          <a href="${process.env.FRONTEND_URL}/unsubscribe">Unsubscribe</a>
        </p>
      </body>
    </html>
  `;
}
