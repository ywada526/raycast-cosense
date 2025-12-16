export function validateUrl(str: string): { ok: true; url: URL } | { ok: false; error: Error } {
  try {
    return { ok: true, url: new URL(str) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error : new Error(`Invalid URL: ${str}`) };
  }
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: Error };

export function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function unescapeHTML(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
