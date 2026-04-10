import { Link } from "react-router-dom";

type FaqItem = {
  question: string;
  answer: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What is The Event Newsletter and who is it for?",
    answer:
      "The Event Newsletter helps people discover relevant local events without endless social media scrolling. It is built for anyone who wants concerts, nightlife, arts, culture, and community events matched to their interests. The system works worldwide where online event data is available and looks up to two months ahead so important events are less likely to be missed.",
  },
  {
    question: "How does The Event Newsletter choose events for me?",
    answer:
      "You set preferences such as genres, venues, and event types. The system uses AI-assisted web discovery and ranking to curate events that match your profile. Sources can include Eventbrite, Ticketmaster, Facebook events, and local event calendars.",
  },
  {
    question: "How often will I receive the newsletter?",
    answer:
      "You receive a weekly event newsletter with fresh recommendations. Each issue can include events over the next two months, giving you enough time to plan while avoiding inbox overload.",
  },
  {
    question: "Can I update my event preferences later?",
    answer:
      "Yes. You can update your preferences at any time in your account. The next newsletter will use your latest settings so recommendations stay relevant.",
  },
  {
    question: "Does The Event Newsletter cover my city or area?",
    answer:
      "Coverage depends on how much online event data exists in your area. Large cities usually have broader coverage, while smaller areas may return fewer results. You can narrow your location to specific neighborhoods for more niche events nearby. The product is currently designed to work broadly across cities rather than being hyper-optimized for one location.",
  },
  {
    question: "How do I get started?",
    answer:
      "Create an account, set your preferences, and confirm your email. After setup, you can generate your first newsletter and test your settings. You also get a second newsletter to refine preferences. These initial newsletters are not auto-emailed; you can send them manually. After that, a subscription is required for ongoing weekly delivery.",
  },
  {
    question: "How does the subscription work?",
    answer:
      "You can choose from multiple subscription durations, and longer plans are usually lower cost per period. Billing is upfront for the selected duration and renews automatically by default. If you cancel, access remains active until the current paid period ends, then stops renewing.",
  },
  {
    question: "Why is this a paid service?",
    answer:
      "The service uses a direct paid model: you pay for value, not with your data. This keeps the business model transparent and aligned with delivering useful event recommendations instead of monetizing personal information.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function Faq() {
  return (
    <main className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white border border-[#c0c0c0] p-5 md:p-8 space-y-6">
        <header className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-bold text-black">
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-[#404040]">
            Learn how The Event Newsletter works, how recommendations are
            created, and how to get the most relevant local events delivered to
            your inbox.
          </p>
        </header>

        <section aria-label="FAQ list">
          <dl className="space-y-5">
            {FAQ_ITEMS.map((item) => (
              <div
                key={item.question}
                className="border border-[#d4d4d4] bg-[#f9f9f9] p-4"
              >
                <dt className="font-bold text-black">{item.question}</dt>
                <dd className="mt-2 text-sm text-[#303030]">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <nav className="text-sm flex gap-4">
          <Link to="/" className="text-[#000080] hover:underline font-bold">
            Back to Home
          </Link>
          <Link
            to="/register"
            className="text-[#000080] hover:underline font-bold"
          >
            Create Account
          </Link>
        </nav>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </main>
  );
}
