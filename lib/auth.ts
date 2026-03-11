/**
 * Extracts the Bearer token from an Authorization header.
 * Handles any whitespace variation and trims the result.
 * Returns null if the header is missing or malformed.
 */
export function extractBearerToken(header: string | null): string | null {
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}
