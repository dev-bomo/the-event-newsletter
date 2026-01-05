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

export async function generateNewsletter(userId: string) {
  // Discover events for user
  const events = await discoverEventsForUser(userId);

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
  const uniqueEvents = events.slice(0, 20).reduce((acc, event, index) => {
    // Check if we've already added this event to THIS newsletter
    if (!acc.find((e: any) => e.eventId === event.id)) {
      acc.push({
        eventId: event.id,
        order: index,
      });
    }
    return acc;
  }, [] as Array<{ eventId: string; order: number }>);

  console.log("Creating newsletter with", uniqueEvents.length, "unique events");

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

  return newsletter;
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

  // Allow resending for testing (comment out in production if needed)
  // if (newsletter.sentAt) {
  //   throw new Error('Newsletter already sent');
  // }

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

function generateNewsletterHTML(userName: string, events: any[]): string {
  const eventsHTML = events
    .slice(0, 20)
    .map(
      (event, index) => `
    <div style="margin-bottom: 30px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #333;">${index + 1}. ${event.title}</h3>
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
  `
    )
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
