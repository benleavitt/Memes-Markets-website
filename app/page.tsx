import { getEpisodes } from "@/lib/episodes";
import { ORBIT, projectAll } from "@/lib/orbit";

export default async function Home() {
  const episodes = await getEpisodes(ORBIT.COUNT);
  const front = projectAll().at(-1);

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-24">
      <p className="type-label-md text-[var(--mm-text-2)]">Phase 0 — plumbing</p>
      <h1 className="type-display-md mt-4">Memes &amp; Markets</h1>
      <p className="type-body-lg mt-3 text-[var(--mm-text-2)]">
        Where culture, tech &amp; financial markets intersect
        <span className="text-[var(--mm-text-3)]"> · Live Tuesdays &amp; Thursdays</span>
      </p>

      <dl className="type-mono-ticker-sm mt-10 grid gap-2 text-[var(--mm-text-2)]">
        <div>
          <dt className="inline">episodes loaded </dt>
          <dd className="inline text-[var(--mm-text)]">{episodes.length}</dd>
        </div>
        <div>
          <dt className="inline">orbit front card </dt>
          <dd className="inline text-[var(--mm-text)]">
            #{front?.index} @ scale {front?.scale.toFixed(2)}
          </dd>
        </div>
        <div>
          <dt className="inline">accent </dt>
          <dd className="inline text-[var(--mm-accent)]">var(--mm-accent)</dd>
        </div>
      </dl>

      <ul className="mt-10 grid gap-3">
        {episodes.map((e) => (
          <li key={e.id} className="type-body-sm text-[var(--mm-text-2)]">
            <a
              href={e.url}
              className="hover:text-[var(--mm-text)]"
              rel="noreferrer noopener"
              target="_blank"
            >
              {e.title}
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
