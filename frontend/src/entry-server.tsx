import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import AppRoutes from "./AppRoutes";
import "./i18n/config";
import {
  BLOG_LANG_LABELS,
  BlogLang,
  getBlogPostBySlug,
} from "./content/blogPosts";

type SeoData = {
  title: string;
  description: string;
  canonicalPath: string;
  robots?: string;
};

const DEFAULT_SEO: SeoData = {
  title: "The Event Newsletter",
  description:
    "Get a personalized weekly email with local events that match your interests, favorite genres, and venues, so you can discover what to do nearby without endless social media scrolling.",
  canonicalPath: "/",
  robots: "index,follow",
};

const SEO_BY_PATH: Record<string, SeoData> = {
  "/": DEFAULT_SEO,
  "/pricing": {
    title: "Pricing - The Event Newsletter",
    description:
      "Compare plans and choose the one that fits you best to receive personalized local event newsletters and discover more relevant things to do each week.",
    canonicalPath: "/pricing",
    robots: "index,follow",
  },
  "/faq": {
    title: "FAQ - The Event Newsletter",
    description:
      "Read frequently asked questions about how The Event Newsletter works, how event recommendations are selected, and how to get started.",
    canonicalPath: "/faq",
    robots: "index,follow",
  },
  "/terms": {
    title: "Terms - The Event Newsletter",
    description:
      "Review the terms and conditions for using The Event Newsletter, including account usage rules, service scope, and your responsibilities as a user.",
    canonicalPath: "/terms",
    robots: "index,follow",
  },
  "/privacy": {
    title: "Privacy - The Event Newsletter",
    description:
      "Learn what personal data The Event Newsletter collects, how it is used to personalize recommendations, and the choices you have to manage your privacy.",
    canonicalPath: "/privacy",
    robots: "index,follow",
  },
  "/login": {
    title: "Login - The Event Newsletter",
    description: "Log in to your The Event Newsletter account.",
    canonicalPath: "/login",
    robots: "noindex,nofollow",
  },
  "/register": {
    title: "Register - The Event Newsletter",
    description: "Create an account for The Event Newsletter.",
    canonicalPath: "/register",
    robots: "noindex,nofollow",
  },
};

function getSeoData(url: string): SeoData {
  const path = new URL(url, "https://event-newsletter.com").pathname;
  if (path === "/blog") {
    return {
      title: "Blog - The Event Newsletter",
      description:
        "Read practical articles about finding local events, planning your week, and discovering things to do without social media overload.",
      canonicalPath: "/blog",
      robots: "index,follow",
    };
  }

  const blogMatch = path.match(/^\/blog\/([^/]+)(?:\/(en|fr|de|ro))?$/);
  if (blogMatch) {
    const slug = blogMatch[1];
    const lang = (blogMatch[2] as BlogLang | undefined) ?? "en";
    const post = getBlogPostBySlug(slug);
    if (post) {
      const localized = post.translations[lang];
      const langSuffix = lang === "en" ? "" : ` (${BLOG_LANG_LABELS[lang]})`;
      return {
        title: `${localized.title}${langSuffix} - The Event Newsletter`,
        description: localized.excerpt,
        canonicalPath: lang === "en" ? `/blog/${slug}` : `/blog/${slug}/${lang}`,
        robots: "index,follow",
      };
    }
  }

  return SEO_BY_PATH[path] ?? DEFAULT_SEO;
}

export function render(url: string) {
  const appHtml = renderToString(
    <StaticRouter location={url}>
      <AppRoutes />
    </StaticRouter>
  );

  const seo = getSeoData(url);
  const canonicalUrl = `https://event-newsletter.com${seo.canonicalPath}`;
  const head = `
    <title>${seo.title}</title>
    <meta name="description" content="${seo.description}" />
    <link rel="canonical" href="${canonicalUrl}" />
    <meta name="robots" content="${seo.robots ?? "index,follow"}" />
    <meta property="og:title" content="${seo.title}" />
    <meta property="og:description" content="${seo.description}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="The Event Newsletter" />
    <meta property="og:image" content="https://event-newsletter.com/og.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${seo.title}" />
    <meta name="twitter:description" content="${seo.description}" />
    <meta name="twitter:image" content="https://event-newsletter.com/og.png" />
  `;

  return { appHtml, head };
}
