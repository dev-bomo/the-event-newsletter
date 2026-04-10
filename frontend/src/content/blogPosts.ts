import deMarkdown from "./blog/keep-up-with-local-events-without-social-media/de.md?raw";
import enMarkdown from "./blog/keep-up-with-local-events-without-social-media/en.md?raw";
import frMarkdown from "./blog/keep-up-with-local-events-without-social-media/fr.md?raw";
import roMarkdown from "./blog/keep-up-with-local-events-without-social-media/ro.md?raw";

export type BlogLang = "en" | "fr" | "de" | "ro";

export type BlogLocalizedContent = {
  title: string;
  excerpt: string;
  markdown: string;
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

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
