# Deployment

Two environments on one Vercel project, driven entirely by which branch you push
to. There is no separate project for staging — a second project would need its
own env vars kept in sync by hand, and they drift.

| | Branch | Vercel environment | URL | Indexed |
|---|---|---|---|---|
| Production | `main` | Production | the custom domain, once set | yes |
| Staging | `staging` | Preview | `<project>-git-staging-<scope>.vercel.app` | **no** |
| PR preview | any other | Preview | per-deployment URL | **no** |

`vercel.json` limits automatic deployments to `main` and `staging`, so pushing a
scratch branch does not spend build minutes.

## First-time setup

1. **Import the repo.** vercel.com → Add New → Project → import
   `Ochanda-Charles/Memes-Markets-website`. Framework is detected as Next.js;
   accept every default. The first build publishes Production from `main`.
2. **Confirm the production branch** is `main` under
   Settings → Git → Production Branch.
3. **Add the environment variables** below.
4. **Push `staging` once** to create the staging deployment. The branch already
   exists in the repo.

## Environment variables

Set in Settings → Environment Variables. Nothing here is required for the site to
build and serve — every one of them degrades to a sensible default — so it is
fine to deploy first and add them afterwards.

| Variable | Environments | Why |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Production only | The custom domain. **Leave unset until the domain exists.** See below. |
| `TWITCH_CLIENT_ID` | Production, Preview | Live status. Without it the player shows its offline face and the countdown, which is computed locally and still true. |
| `TWITCH_CLIENT_SECRET` | Production, Preview | As above. |
| `TWITCH_USER_LOGIN` | Production, Preview | Defaults to `memesandmarkets`. |
| `FORCE_LIVE` | Preview only | Forces the player live for demos. Never set this in Production. |
| `SUBSTACK_PUBLICATION_URL` | Production, Preview | Only if the newsletter moves off its current custom domain. |

## Adding the domain later

The site does not hardcode its own URL anywhere. `lib/site.ts` resolves it, and
everything that needs an absolute URL — `metadataBase`, OG images, JSON-LD, the
sitemap — goes through that one function. So:

1. Buy the domain and add it in Vercel → Settings → Domains.
2. Set `NEXT_PUBLIC_SITE_URL` to it, **Production environment only**
   (e.g. `https://memesandmarkets.tv`).
3. Redeploy Production.

Until step 2, production correctly advertises its own `.vercel.app` address.
There is nothing to find and edit.

> **Note on `memesandmarkets.com`.** That domain currently serves the Substack,
> and the site's metadata used to claim it as its own canonical URL — which was
> wrong, and is why this now resolves at runtime. If you want the site on the
> apex, the newsletter needs to move first (usually to a `newsletter.` or `mail.`
> subdomain), and `SUBSTACK_PUBLICATION_URL` must then be updated to match or
> newsletter signups will break.

## Why staging is not indexed

`app/robots.ts` returns `Disallow: /` on anything that is not a Production
deployment. This matters more than it looks: staging is a fully working copy of
the site on a crawlable URL, so without it Google indexes staging and serves it
alongside production, splitting the ranking.

It keys off `VERCEL_ENV`, not `NODE_ENV` — a staging build is a *production* Node
build, so `NODE_ENV` is `production` there too and would wave it straight through.

## The scheduled job

`.github/workflows/refresh-episodes.yml` commits to `main`, which triggers a
production deploy. That is intended: the commit only ever changes
`content/episodes-fallback.json`, and the point is for the live cold-start
fallback to be current. It needs no Vercel configuration.
