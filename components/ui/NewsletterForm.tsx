"use client";

import { useId, useState } from "react";

type State =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "done" }
  | { status: "failed"; message: string; field: boolean };

/**
 * Substack signup box.
 *
 * Posts to /api/subscribe, which proxies to Substack — the endpoint sends no
 * CORS headers, so it cannot be called from here directly. See lib/newsletter.ts.
 *
 * It is a real <form> with a real `action`, so it still submits with JavaScript
 * off: the route detects a urlencoded body and redirects to /subscribed instead
 * of answering JSON. The fetch below is the enhancement, not the mechanism.
 *
 * That no-JS path is only reachable from the footer copy of this form. The one in
 * the More info panel sits inside a <dialog> that needs showModal() to open at
 * all, so without JavaScript nobody can get to it — which is exactly why the box
 * is in the footer as well, rather than only in the panel.
 *
 * The status line is aria-live, because the entire outcome of this interaction is
 * a sentence appearing under a text field. Without it a screen reader user
 * presses Subscribe and is told nothing at all.
 */
export function NewsletterForm() {
  const id = useId();
  const [state, setState] = useState<State>({ status: "idle" });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "");

    setState({ status: "sending" });
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, company: String(data.get("company") ?? "") }),
      });
      const body = (await res.json()) as {
        ok?: boolean;
        message?: string;
        field?: boolean;
      };
      if (body.ok) {
        setState({ status: "done" });
        form.reset();
        return;
      }
      setState({
        status: "failed",
        message: body.message ?? "That did not work. Please try again.",
        field: Boolean(body.field),
      });
    } catch {
      setState({
        status: "failed",
        message: "Something went wrong sending that. Please try again.",
        field: false,
      });
    }
  };

  if (state.status === "done") {
    /*
     * "On the list", NOT "subscribed", and that distinction is the honest one.
     *
     * The address has been written to a sheet the show controls; it reaches
     * Substack when somebody imports the batch. Claiming "you're subscribed"
     * would be a confident lie of exactly the kind this box has told before — it
     * once promised a confirmation email that was never going to arrive. Say
     * what actually happened instead.
     */
    return (
      <p className="type-body-md mt-4" style={{ color: "var(--mm-text)" }}>
        <strong style={{ color: "var(--mm-accent)" }}>You&rsquo;re on the list.</strong>{" "}
        New readers are added to the newsletter before each issue goes out, so
        you&rsquo;ll get the next one.
      </p>
    );
  }

  const failed = state.status === "failed";
  const invalidField = failed && state.field;

  return (
    <form
      action="/api/subscribe"
      method="post"
      onSubmit={onSubmit}
      className="mt-4"
      noValidate
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor={`${id}-email`}>
          Email address
        </label>
        <input
          id={`${id}-email`}
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="name@email.com"
          aria-invalid={invalidField || undefined}
          aria-describedby={failed ? `${id}-status` : undefined}
          className="type-body-md min-w-0 flex-1 rounded-[10px] border px-4 py-3"
          style={{
            background: "var(--mm-surface)",
            borderColor: invalidField ? "var(--mm-accent)" : "var(--mm-border)",
            color: "var(--mm-text)",
          }}
        />

        {/* Honeypot. Hidden from sight and from assistive tech, and skipped in the
            tab order, so only something filling every field will touch it. */}
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        <button
          type="submit"
          disabled={state.status === "sending"}
          className="mm-cta rounded-[10px] px-6 py-3 uppercase transition-transform duration-150 hover:scale-[1.02] active:scale-100 disabled:opacity-70"
        >
          {state.status === "sending" ? "Sending…" : "Subscribe"}
        </button>
      </div>

      {/* <output> rather than a <p aria-live>: it carries an implicit status role
          and live region, and it is the element that exists for "the result of a
          form interaction". */}
      <output
        id={`${id}-status`}
        className="type-mono-ticker-sm mt-3 block uppercase"
        style={{ color: failed ? "var(--mm-accent)" : "var(--mm-text-3)" }}
      >
        {failed ? state.message : "Free. Unsubscribe any time."}
      </output>
    </form>
  );
}
