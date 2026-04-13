import { Link, Navigate, useParams } from "react-router-dom";
import { marked } from "marked";
import {
  BLOG_LANG_LABELS,
  BlogLang,
  getBlogPostBySlug,
} from "../content/blogPosts";
import Windows98Window from "../components/Windows98Window";

const SUPPORTED_LANGS: BlogLang[] = ["en", "fr", "de", "ro"];

function normalizeLang(value: string | undefined): BlogLang {
  if (!value) return "en";
  return SUPPORTED_LANGS.includes(value as BlogLang)
    ? (value as BlogLang)
    : "en";
}

export default function BlogPostPage() {
  const { slug, lang } = useParams();
  if (!slug) return <Navigate to="/blog" replace />;

  const post = getBlogPostBySlug(slug);
  if (!post) return <Navigate to="/blog" replace />;

  const activeLang = normalizeLang(lang);
  const content = post.translations[activeLang];
  const html = marked.parse(content.markdown, { async: false });

  return (
    <main className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <article className="max-w-3xl mx-auto">
        <Windows98Window title={content.title} className="!border">
          <div className="bg-white border border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] p-5 md:p-8 space-y-6">
            <header className="space-y-2">
              <p className="text-xs text-[#606060]">Published: {post.publishedAt}</p>
              <h1 className="text-2xl md:text-3xl font-bold text-black">
                {content.title}
              </h1>
              <p className="text-sm text-[#404040]">{content.excerpt}</p>
            </header>

            {content.heroImageSrc ? (
              <img
                src={content.heroImageSrc}
                alt={content.heroImageAlt ?? content.title}
                className="w-full max-w-2xl mx-auto border border-[#c0c0c0] bg-white p-1"
                loading="lazy"
              />
            ) : null}

            <nav
              aria-label="Language versions"
              className="text-xs text-black flex flex-wrap gap-2"
            >
              {SUPPORTED_LANGS.map((language) => (
                <Link
                  key={language}
                  to={`/blog/${post.slug}/${language}`}
                  className={`px-2 py-1 border ${
                    language === activeLang
                      ? "bg-[#000080] text-white border-[#000080]"
                      : "bg-[#f3f3f3] text-[#000080] border-[#c0c0c0]"
                  }`}
                >
                  {BLOG_LANG_LABELS[language]}
                </Link>
              ))}
            </nav>

            <section
              className="blog-markdown text-[#303030]"
              dangerouslySetInnerHTML={{ __html: html }}
            />

            <nav className="text-sm flex gap-4">
              <Link to="/blog" className="text-[#000080] hover:underline font-bold">
                Back to Blog
              </Link>
              <Link to="/" className="text-[#000080] hover:underline font-bold">
                Back to Home
              </Link>
            </nav>
          </div>
        </Windows98Window>
      </article>
    </main>
  );
}
