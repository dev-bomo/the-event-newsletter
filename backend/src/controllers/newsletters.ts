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

export async function generateNewsletter(userId: string) {
  // Check newsletter limit
  const count = await prisma.newsletter.count({
    where: { userId },
  });
  if (count >= NEWSLETTER_LIMIT_PER_USER) {
    throw new Error(
      "You've reached the limit of 5 newsletters. Contact support to request more."
    );
  }

  // Discover events for user
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

      return `
    <div style="margin-bottom: 30px; padding: 20px; border: 1px solid #e0e0e0; border-left: 4px solid ${categoryColor}; border-radius: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
        <h3 style="margin-top: 0; color: #333; flex: 1;">${index + 1}. ${
        event.title
      }</h3>
        ${
          score !== null
            ? `<div style="background-color: ${scoreColor}; color: white; padding: 4px 12px; border-radius: 12px; font-weight: bold; font-size: 14px; white-space: nowrap; margin-left: 10px;">
                 ${score}/100
               </div>`
            : ""
        }
      </div>
      ${
        event.description
          ? `<p style="color: #666;">${event.description}</p>`
          : ""
      }
      <div style="margin-top: 10px;">
        <p style="margin: 5px 0; color: #555;">
          <strong>📅 Date:</strong> ${event.date.toLocaleDateString()} ${
        event.time || ""
      }
        </p>
        <p style="margin: 5px 0; color: #555;">
          <strong>📍 Location:</strong> ${event.location}
        </p>
        ${
          event.category
            ? `<p style="margin: 5px 0; color: #555;"><strong>Category:</strong> ${event.category}</p>`
            : ""
        }
        <a href="${
          event.sourceUrl
        }" style="display: inline-block; margin-top: 10px; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Learn More</a>
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
