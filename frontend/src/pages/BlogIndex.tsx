import { Link } from "react-router-dom";
import { blogPosts } from "../content/blogPosts";
import Windows98Window from "../components/Windows98Window";

export default function BlogIndex() {
  return (
    <main className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Windows98Window title="Event Newsletter Blog" className="!border" fitContent>
          <div className="bg-white border border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] p-5 md:p-8 space-y-6">
            <header className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold text-black">
                Event Newsletter Blog
              </h1>
              <p className="text-sm text-[#404040]">
                Practical guides on local event discovery, event planning, and
                how to stay informed without social media overload.
              </p>
            </header>

            <section aria-label="Blog posts list" className="space-y-4">
              {blogPosts.map((post) => (
                <article
                  key={post.slug}
                  className="border border-[#d4d4d4] bg-[#f9f9f9] p-4"
                >
                  <h2 className="text-lg font-bold text-black">
                    <Link
                      to={`/blog/${post.slug}`}
                      className="text-[#000080] hover:underline"
                    >
                      {post.translations.en.title}
                    </Link>
                  </h2>
                  <p className="text-sm text-[#303030] mt-2">
                    {post.translations.en.excerpt}
                  </p>
                  <p className="text-xs text-[#606060] mt-3">
                    Published: {post.publishedAt}
                  </p>
                </article>
              ))}
            </section>

            <nav className="text-sm">
              <Link to="/" className="text-[#000080] hover:underline font-bold">
                Back to Home
              </Link>
            </nav>
          </div>
        </Windows98Window>
      </div>
    </main>
  );
}
