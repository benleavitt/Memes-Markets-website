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
  constructor(what, detail, { transport = false } = {}) {
    super(what);
    this.detail = detail;
    /**
     * True when the feed never answered at all, false when it answered with
     * something the parser could not use. Only the first kind can be YouTube
     * refusing the caller rather than the feed being broken, so only the first
     * kind is worth a second opinion — see CONTROL_FEED.
     */
    this.transport = transport;
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

/**
 * A second, unrelated feed, used to tell the two 404s apart.
 *
 * WHY THIS EXISTS RATHER THAN MORE RETRIES. The retries above were the previous
 * answer to a throttled runner, and on 2026-08-18 a throttle simply outlasted
 * them: four attempts, four 404s, 65 seconds, and the same URL answering 200
 * from a desktop minutes later. Widening that window again would be the check
 * being loosened, which rule 5 in CLAUDE.md forbids — and it would not work
 * anyway, because every retry leaves from the same runner IP and an IP block
 * does not care how long you knock.
 *
 * So this asks a different question instead of asking the same one harder. Once
 * our feed has failed every attempt, fetch a channel that will outlive this
 * repo, from the same runner, at the same moment, with the same user-agent:
 *
 *   control also fails  -> YouTube is refusing this runner, not this channel.
 *   control answers 200 -> our feed alone is gone. That is the real alarm, and
 *                          it is now evidence-backed rather than inferred.
 *
 * This does not give a broken feed anywhere to hide. Each scheduled run gets a
 * different runner IP and the block is per-IP, so a genuinely dead feed goes red
 * on the first run that is not throttled — twice a day, so within about a day. A
 * throttle can delay the alarm by a run. It cannot silence it.
 */
const CONTROL_FEED =
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCBR8-60-B28hp2BmDPdntcQ";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Module scope because the throttled path below reports `changed` as well. */
const setOutput = (changed) => {
  if (process.env.GITHUB_OUTPUT) {
    writeFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`, { flag: "a" });
  }
};

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
    { transport: true },
  );
}

/**
 * Second opinion on a feed that never answered: is YouTube refusing this runner,
 * or has our channel actually gone? See CONTROL_FEED for why that is the question
 * worth asking, and why asking the original one harder is not.
 *
 * Conservative on purpose. Only a control feed that fails too buys any silence.
 * If the control cannot be reached at all the answer is unknown, and an unknown
 * keeps the alarm rather than muting it.
 */
async function runnerIsBlocked() {
  try {
    const res = await fetch(CONTROL_FEED, { headers: { "user-agent": FEED_UA } });
    // Drained so the socket closes and the process can exit on its own.
    await res.text();
    console.log(`control feed answered HTTP ${res.status}`);
    return !res.ok;
  } catch (err) {
    console.log(`control feed could not be reached: ${err.message}`);
    return false;
  }
}

/**
 * The throttled case: loud in the log, annotated on the run, but green.
 *
 * Green because nothing has been shown to be wrong with the feed, and a red
 * light that fires on someone else's rate limiter is a red light people stop
 * reading — which costs the real failure its only chance of being noticed.
 */
function warnBlocked(err) {
  if (process.env.GITHUB_ACTIONS) {
    console.log(
      "::warning title=Feed check skipped::YouTube refused this runner's IP, not " +
        "the feed. The fallback was left alone.",
    );
  }
  console.warn(`\nFEED CHECK SKIPPED: ${err.message}`);
  if (err.detail) console.warn(err.detail);
  console.warn(
    [
      "",
      "The control feed failed from this runner too, so this is YouTube blocking",
      "the runner by IP rather than anything wrong with the channel. Nothing was",
      "written; the fallback is unchanged.",
      "",
      "A genuinely dead feed still goes red — the next run gets a different IP.",
      "If this warning repeats for more than a day or so, check the feed by hand:",
      `  ${FEED}`,
    ].join("\n"),
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
  // A feed that never answered gets a second opinion before it is called broken.
  // Anything else — parsed but empty, dateless, untitled — is unambiguously ours.
  if (err instanceof FeedError && err.transport && (await runnerIsBlocked())) {
    warnBlocked(err);
    setOutput(false);
  } else {
    if (err instanceof FeedError) report(err);
    else console.error(err);
    process.exitCode = 1;
  }
}
