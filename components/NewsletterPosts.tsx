import { PUBLICATION } from "@/lib/newsletter";
import type { Post } from "@/lib/posts";

/**
 * Recent posts from the Substack.
 *
 * RENDERS NOTHING WHEN THERE IS NOTHING WORTH RENDERING — an unreachable feed,
 * an unparseable one, or a newest post older than FRESH_DAYS all arrive here as
 * an empty array. See lib/posts.ts for why staleness hides it: a "latest from
 * the newsletter" block whose newest entry is six months old advertises an
 * abandoned newsletter, on the same page as a form asking people to subscribe.
 *
 * The footer has claimed "straight from our Substack" since it was written. This
 * is the first thing on the site that backs the claim up.
 */
export function NewsletterPosts({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;

  return (
    <section
      aria-labelledby="newsletter-posts"
      className="mx-auto w-full max-w-[1200px] px-6 pt-16 pb-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b pb-3">
        <h2
          id="newsletter-posts"
          className="type-mono-label"
          style={{ color: "var(--mm-text)" }}
        >
          From the newsletter
        </h2>
        <a
          href={PUBLICATION}
          target="_blank"
          rel="noreferrer noopener"
          className="type-mono-ticker-sm uppercase underline decoration-[var(--mm-border-strong)] underline-offset-4 transition-colors duration-150 hover:decoration-[var(--mm-accent)]"
          style={{ color: "var(--mm-text-3)" }}
        >
          Read all
        </a>
      </div>

      <ul className="mt-6 grid gap-px md:grid-cols-3">
        {posts.map((post) => (
          <li key={post.url}>
            <a
              href={post.url}
              target="_blank"
              rel="noreferrer noopener"
              className="group flex h-full flex-col rounded-[14px] border p-5 no-underline transition-colors duration-150 hover:border-[var(--mm-accent)]"
              style={{
                background: "var(--mm-surface)",
                borderColor: "var(--mm-border)",
              }}
            >
              <time
                className="type-mono-ticker-sm uppercase"
                dateTime={post.published}
                style={{ color: "var(--mm-text-3)" }}
              >
                {formatDate(post.published)}
              </time>
              <h3
                className="type-heading-md mt-3 text-balance"
                style={{ color: "var(--mm-text)" }}
              >
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="type-body-sm mt-3" style={{ color: "var(--mm-text-2)" }}>
                  {post.excerpt}
                </p>
              )}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Matches the orbit cards, so two dated things on one page read the same way. */
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
