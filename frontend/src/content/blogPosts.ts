import deMarkdown from "./blog/keep-up-with-local-events-without-social-media/de.md?raw";
import enMarkdown from "./blog/keep-up-with-local-events-without-social-media/en.md?raw";
import frMarkdown from "./blog/keep-up-with-local-events-without-social-media/fr.md?raw";
import roMarkdown from "./blog/keep-up-with-local-events-without-social-media/ro.md?raw";
import mySolutionDeMarkdown from "./blog/my-solution-to-keeping-up-to-date-with-events-in-my-area/de.md?raw";
import mySolutionEnMarkdown from "./blog/my-solution-to-keeping-up-to-date-with-events-in-my-area/en.md?raw";
import mySolutionFrMarkdown from "./blog/my-solution-to-keeping-up-to-date-with-events-in-my-area/fr.md?raw";
import mySolutionRoMarkdown from "./blog/my-solution-to-keeping-up-to-date-with-events-in-my-area/ro.md?raw";
import mySolutionBlog2 from "./blog/my-solution-to-keeping-up-to-date-with-events-in-my-area/blog2.png";

export type BlogLang = "en" | "fr" | "de" | "ro";

export type BlogLocalizedContent = {
  title: string;
  excerpt: string;
  markdown: string;
  heroImageSrc?: string;
  heroImageAlt?: string;
};

export type BlogPost = {
  slug: string;
  publishedAt: string;
  updatedAt: string;
  tags: string[];
  translations: Record<BlogLang, BlogLocalizedContent>;
};

export const BLOG_LANG_LABELS: Record<BlogLang, string> = {
  en: "English",
  fr: "Francais",
  de: "Deutsch",
  ro: "Romana",
};

function parseMarkdownPost(raw: string): BlogLocalizedContent {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  let title = "";
  let excerpt = "";
  let bodyStart = 0;

  if (lines[0] === "---") {
    let i = 1;
    for (; i < lines.length; i += 1) {
      if (lines[i] === "---") break;
      if (lines[i].startsWith("title:")) {
        title = lines[i].replace("title:", "").trim();
      } else if (lines[i].startsWith("excerpt:")) {
        excerpt = lines[i].replace("excerpt:", "").trim();
      }
    }
    bodyStart = i + 1;
  }

  const markdown = lines.slice(bodyStart).join("\n").trim();

  return {
    title: title || "Untitled post",
    excerpt: excerpt || "",
    markdown,
  };
}

export const blogPosts: BlogPost[] = [
  {
    slug: "my-solution-to-keeping-up-to-date-with-events-in-my-area",
    publishedAt: "2026-04-10",
    updatedAt: "2026-04-10",
    tags: ["local events", "event discovery", "personal workflow"],
    translations: {
      en: parseMarkdownPost(mySolutionEnMarkdown),
      fr: parseMarkdownPost(mySolutionFrMarkdown),
      de: parseMarkdownPost(mySolutionDeMarkdown),
      ro: parseMarkdownPost(mySolutionRoMarkdown),
    },
  },
  {
    slug: "keep-up-with-local-events-without-social-media",
    publishedAt: "2026-04-10",
    updatedAt: "2026-04-10",
    tags: ["local events", "event discovery", "newsletter"],
    translations: {
      en: parseMarkdownPost(enMarkdown),
      fr: parseMarkdownPost(frMarkdown),
      de: parseMarkdownPost(deMarkdown),
      ro: parseMarkdownPost(roMarkdown),
    },
  },
];

blogPosts[0].translations.en.heroImageSrc = mySolutionBlog2;
blogPosts[0].translations.en.heroImageAlt =
  "Local events planning notes and calendar";
blogPosts[0].translations.fr.heroImageSrc = mySolutionBlog2;
blogPosts[0].translations.fr.heroImageAlt =
  "Notes de planification d evenements locaux et calendrier";
blogPosts[0].translations.de.heroImageSrc = mySolutionBlog2;
blogPosts[0].translations.de.heroImageAlt =
  "Notizen zur Planung lokaler Events und Kalender";
blogPosts[0].translations.ro.heroImageSrc = mySolutionBlog2;
blogPosts[0].translations.ro.heroImageAlt =
  "Notite pentru planificarea evenimentelor locale si calendar";

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
