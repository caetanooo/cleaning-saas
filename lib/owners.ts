/**
 * Returns the list of owner emails from the OWNER_EMAILS environment variable.
 * Format: comma-separated list, e.g. "a@example.com,b@example.com"
 * Server-side only — never use in "use client" components.
 */
export function getOwnerEmails(): string[] {
  return (process.env.OWNER_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}
