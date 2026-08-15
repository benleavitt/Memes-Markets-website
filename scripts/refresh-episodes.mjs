/**
 * Refreshes the committed episode fallback, and acts as the feed's health check.
 *
 *   node scripts/refresh-episodes.mjs            (or: npm run episodes:refresh)
 *   node scripts/refresh-episodes.mjs --check    verify only, never write
 *
 * TWO JOBS, and the second is the important one.
 *
 * 1. Keep content/episodes-fallback.json current. It is only ever read when the
 *    live feed fails on a cold build — the one moment it needs to be good — so a
 *    fallback that quietly ages for months is barely a fallback at all.
 *
 * 2. Fail loudly when the feed stops parsing. lib/episodes.ts swallows every
 *    error by design: a hero of real-but-old episodes beats an empty one. The
 *    cost of that kindness is that a YouTube format change is invisible from the
 *    site — the orbit would show the same twelve episodes forever and nothing
 *    would say why. This script is the alarm. A non-zero exit on a scheduled run
 *    is the notification.
 *
 * It deliberately imports lib/feed.ts rather than parsing the XML itself. A job
 * with its own parser would prove that *some* parser can read the feed, which is
 * not the question. The question is whether the site's parser still can.
 *
 * Node strips the TypeScript natively (>= 22.6), which is why lib/feed.ts must
 * not import JSON — see the note in that file.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { FEED, FEED_UA, parseFeed } from "../lib/feed.ts";

const OUT = new URL("../content/episodes-fallback.json", import.meta.url);
/** Written to the fallback file. Twelve are shown; the spare few cost nothing. */
const KEEP = 15;
const checkOnly = process.argv.includes("--check");

/**
 * Thrown rather than exiting on the spot.
 *
 * process.exit() while undici still holds a keep-alive socket trips a libuv
 * assertion on Windows and returns 127 — which would report a perfectly healthy
 * feed as a CI failure. Everything here sets process.exitCode and returns, so the
 * runtime tears its own handles down first.
 */
class FeedError extends Error {
  constructor(what, detail) {
    super(what);
    this.detail = detail;
  }
}

/**
 * How hard to try before calling the feed broken.
 *
 * This is NOT the check being loosened — read the rule in CLAUDE.md before
 * touching it. A single failed request and a broken feed are different events,
 * and until now this script could not tell them apart.
 *
 * YouTube serves this endpoint a plain 404 when it decides to throttle the
 * caller by IP, which on a shared GitHub Actions runner happens for reasons that
 * have nothing to do with the channel. That is exactly what failed the 2026-08-15
 * run: the same URL, same user-agent, answered 200 with fifteen episodes from a
 * desktop minutes later, and the four runs either side of it passed. An alarm
 * that fires on that is an alarm people learn to ignore, which costs the real
 * failure its only chance of being noticed.
 *
 * So a failure now has to persist across every attempt below, spread over about
 * a minute, before the job goes red. A genuinely dead feed fails all four and
 * still reports — one bad minute on a shared IP does not.
 */
const ATTEMPTS = 4;
/** Between attempts. Growing, because a throttle needs time rather than nagging. */
const BACKOFF_MS = [5_000, 15_000, 45_000];

/** 404 is in here because of the throttling behaviour described above. */
const RETRYABLE = new Set([404, 408, 425, 429, 500, 502, 503, 504]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch the feed, retrying transient failures. Returns the body on success.
 * Throws FeedError, carrying every attempt's outcome, only if all of them fail.
 */
async function fetchFeed() {
  const tried = [];

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    let outcome;
    try {
      const res = await fetch(FEED, { headers: { "user-agent": FEED_UA } });
      if (res.ok) {
        if (attempt > 1) console.log(`feed answered on attempt ${attempt}`);
        return await res.text();
      }
      outcome = { label: `HTTP ${res.status}`, retryable: RETRYABLE.has(res.status) };
    } catch (err) {
      // Network-level: DNS, TLS, connection reset. Always worth another go.
      outcome = { label: `network error: ${err.message}`, retryable: true };
    }

    tried.push(`  attempt ${attempt}: ${outcome.label}`);
    if (!outcome.retryable) break;
    if (attempt < ATTEMPTS) {
      const wait = BACKOFF_MS[attempt - 1];
      console.log(`feed ${outcome.label}, retrying in ${wait / 1000}s`);
      await sleep(wait);
    }
  }

  throw new FeedError(
    `the feed did not answer across ${tried.length} attempt(s)`,
    tried.join("\n"),
  );
}

function report(err) {
  console.error(`\nFEED CHECK FAILED: ${err.message}`);
  if (err.detail) console.error(err.detail);
  console.error(
    [
      "",
      "The site will keep serving content/episodes-fallback.json, so nothing is",
      "visibly broken — but the orbit is frozen at whatever that file holds.",
      `Check the feed by hand: ${FEED}`,
      "If YouTube changed the format, parseFeed in lib/feed.ts needs updating.",
    ].join("\n"),
  );
}

async function main() {
  const xml = await fetchFeed();

  let episodes;
  try {
    episodes = parseFeed(xml);
  } catch (err) {
    throw new FeedError("parseFeed threw on the feed body", err.message);
  }

  // The distinction that matters: reachable but unreadable. A 200 carrying XML we
  // no longer understand is the exact failure the site cannot report on its own.
  if (episodes.length === 0) {
    throw new FeedError(
      "the feed was reachable but produced no episodes",
      `${xml.length} bytes came back. Either the channel is empty or the feed's\nshape changed and parseFeed no longer recognises it.`,
    );
  }

  const missingDates = episodes.filter((e) => !e.published).map((e) => e.id);
  if (missingDates.length) {
    throw new FeedError(
      "entries parsed without publication dates",
      `Affected ids: ${missingDates.join(", ")}. The orbit renders these as a blank date.`,
    );
  }

  /*
   * Titles, which this job used to take entirely on trust.
   *
   * "Reachable, parses, produces the right NUMBER of entries, and every one of
   * them is garbage" is a real failure mode — it is what a stringified object
   * looks like when a field grows an attribute — and the checks above sail
   * straight past it. See the note on `text` in lib/feed.ts.
   */
  const brokenTitles = episodes
    .filter((e) => e.title.includes("[object"))
    .map((e) => e.id);
  if (brokenTitles.length) {
    throw new FeedError(
      "entries parsed with unreadable titles",
      `Affected ids: ${brokenTitles.join(", ")}. A title node is no longer a plain\nstring — parseFeed in lib/feed.ts needs to unwrap whatever shape it now has.`,
    );
  }

  // One genuinely untitled upload is possible. All of them means the field moved.
  if (episodes.every((e) => e.title === "Untitled episode")) {
    throw new FeedError(
      "no entry carried a title",
      "Every entry fell back to the placeholder, so the title element has been\nrenamed or nested. parseFeed in lib/feed.ts needs updating.",
    );
  }

  const current = JSON.parse(readFileSync(OUT, "utf8"));
  const next = {
    _comment:
      "GENERATED by scripts/refresh-episodes.mjs. Cold-start fallback for lib/episodes.ts, " +
      "used only when the live YouTube feed is unreachable or unparseable. Re-run the " +
      "script rather than editing by hand.",
    episodes: episodes.slice(0, KEEP).map(({ id, title, published }) => ({
      id,
      title,
      published,
    })),
  };

  console.log(`feed ok: ${episodes.length} episodes, newest ${episodes[0].published}`);
  console.log(`         ${episodes[0].title}`);

  const setOutput = (changed) => {
    if (process.env.GITHUB_OUTPUT) {
      writeFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`, { flag: "a" });
    }
  };

  if (JSON.stringify(current.episodes) === JSON.stringify(next.episodes)) {
    console.log("fallback already current, nothing to write");
    setOutput(false);
    return;
  }

  const added = next.episodes.filter((e) => !current.episodes.some((c) => c.id === e.id));
  console.log(`fallback is ${added.length} episode(s) behind:`);
  for (const e of added) console.log(`  + ${e.published.slice(0, 10)}  ${e.title}`);

  if (checkOnly) {
    console.log("\n--check: not writing. Run without the flag to update.");
    setOutput(false);
    return;
  }

  writeFileSync(OUT, `${JSON.stringify(next, null, 2)}\n`);
  console.log("\nwrote content/episodes-fallback.json");
  setOutput(true);
}

try {
  await main();
} catch (err) {
  if (err instanceof FeedError) report(err);
  else console.error(err);
  process.exitCode = 1;
}
