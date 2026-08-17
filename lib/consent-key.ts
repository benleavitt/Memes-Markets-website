/**
 * The localStorage key holding the visitor's cookie choice.
 *
 * A whole file for one string, and it earns it. This value is needed on BOTH
 * sides of the server/client boundary — by lib/consent.ts, which is "use client",
 * and by the inline bootstrap in components/Analytics.tsx, which is a server
 * component interpolating it into a <script>.
 *
 * Exporting it from lib/consent.ts and importing that from the server component
 * does not work, and fails in a way worth remembering: React hands the server a
 * client REFERENCE rather than the value, so the template literal stringified to
 *
 *   localStorage.getItem('function() { throw new Error("Attempted to call
 *   CONSENT_KEY() from the server...
 *
 * which is a syntactically valid script that silently does nothing useful. No
 * build error, no runtime error in the page — just an analytics bootstrap that
 * had quietly stopped running.
 *
 * A module marked by neither side can be imported by both, which is what this is.
 */
export const CONSENT_KEY = "mm-consent";
