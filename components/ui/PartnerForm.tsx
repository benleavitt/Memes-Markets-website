"use client";

import { ENQUIRY_KINDS, LIMITS } from "@/lib/partner";
import { useId, useState } from "react";

type State =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "done" }
  | { status: "failed"; message: string; field?: string };

/**
 * Partnership and sponsorship enquiries. Posts to /api/partner, which forwards
 * to a Google Sheet — see lib/partner.ts for why it is proxied rather than
 * posted straight at Apps Script.
 *
 * Unlike the newsletter box there is no no-JavaScript path here. That box is in
 * the root layout on every page and had to keep working without scripts; this is
 * one page a sponsor reaches deliberately, and a urlencoded fallback would mean
 * a second response shape and a second results page for a form perhaps ten
 * people a month submit. The email address below is the fallback instead, and it
 * is a better one: it works when the sheet is misconfigured too.
 */
export function PartnerForm({ contactEmail }: { contactEmail: string }) {
  const id = useId();
  const [state, setState] = useState<State>({ status: "idle" });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    setState({ status: "sending" });
    try {
      const res = await fetch("/api/partner", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          organisation: data.get("organisation"),
          kind: data.get("kind"),
          message: data.get("message"),
          company: data.get("company"),
        }),
      });
      const body = (await res.json()) as {
        ok?: boolean;
        message?: string;
        field?: string;
      };
      if (body.ok) {
        setState({ status: "done" });
        form.reset();
        return;
      }
      setState({
        status: "failed",
        message: body.message ?? "That did not send. Please try again.",
        field: body.field,
      });
    } catch {
      setState({
        status: "failed",
        message: "Something went wrong sending that. Please try again.",
      });
    }
  };

  if (state.status === "done") {
    return (
      <div
        className="rounded-[16px] border p-8"
        style={{ background: "var(--mm-surface)", borderColor: "var(--mm-border)" }}
      >
        <h2 className="type-heading-lg" style={{ color: "var(--mm-accent)" }}>
          Got it.
        </h2>
        <p className="type-body-lg mt-3" style={{ color: "var(--mm-text-2)" }}>
          Your message is with Keith and Ben. They read these themselves, so a reply comes
          from a person rather than a queue — usually within a few days.
        </p>
      </div>
    );
  }

  const failed = state.status === "failed";
  const bad = (field: string) => failed && state.field === field;

  const fieldStyle = (field: string) => ({
    background: "var(--mm-surface)",
    borderColor: bad(field) ? "var(--mm-accent)" : "var(--mm-border)",
    color: "var(--mm-text)",
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" htmlFor={`${id}-name`}>
          <input
            id={`${id}-name`}
            name="name"
            required
            maxLength={LIMITS.name}
            autoComplete="name"
            aria-invalid={bad("name") || undefined}
            className="type-body-md w-full rounded-[10px] border px-4 py-3"
            style={fieldStyle("name")}
          />
        </Field>

        <Field label="Email" htmlFor={`${id}-email`}>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            required
            maxLength={LIMITS.email}
            autoComplete="email"
            aria-invalid={bad("email") || undefined}
            className="type-body-md w-full rounded-[10px] border px-4 py-3"
            style={fieldStyle("email")}
          />
        </Field>

        <Field label="Company or brand" htmlFor={`${id}-org`} optional>
          <input
            id={`${id}-org`}
            name="organisation"
            maxLength={LIMITS.organisation}
            autoComplete="organization"
            aria-invalid={bad("organisation") || undefined}
            className="type-body-md w-full rounded-[10px] border px-4 py-3"
            style={fieldStyle("organisation")}
          />
        </Field>

        <Field label="What is this about" htmlFor={`${id}-kind`}>
          <select
            id={`${id}-kind`}
            name="kind"
            required
            defaultValue={ENQUIRY_KINDS[0]}
            aria-invalid={bad("kind") || undefined}
            className="type-body-md w-full rounded-[10px] border px-4 py-3"
            style={fieldStyle("kind")}
          >
            {ENQUIRY_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {kind}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-5">
        <Field label="Tell us about it" htmlFor={`${id}-message`}>
          <textarea
            id={`${id}-message`}
            name="message"
            required
            rows={6}
            maxLength={LIMITS.message}
            aria-invalid={bad("message") || undefined}
            placeholder="Budget, timing, what you have in mind — whatever is useful."
            className="type-body-md w-full rounded-[10px] border px-4 py-3"
            style={fieldStyle("message")}
          />
        </Field>
      </div>

      {/* Honeypot. Hidden from sight and from assistive tech, out of the tab
          order, so only something filling every field will touch it. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={state.status === "sending"}
          className="mm-cta rounded-[10px] px-8 py-4 uppercase transition-transform duration-150 hover:scale-[1.02] active:scale-100 disabled:opacity-70"
        >
          {state.status === "sending" ? "Sending…" : "Send enquiry"}
        </button>

        <output
          className="type-mono-ticker-sm block"
          style={{ color: failed ? "var(--mm-accent)" : "var(--mm-text-3)" }}
        >
          {failed ? state.message : `Or email ${contactEmail}`}
        </output>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="type-mono-label mb-2 block"
        style={{ color: "var(--mm-text-2)" }}
      >
        {label}
        {optional && <span style={{ color: "var(--mm-text-3)" }}> — optional</span>}
      </label>
      {children}
    </div>
  );
}
