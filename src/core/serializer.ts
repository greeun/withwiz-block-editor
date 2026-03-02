/**
 * Generic serializer factory.
 * Creates serialize/deserialize functions for a given marker string.
 * Data is stored as base64-encoded JSON inside HTML comments: <!-- {marker}{base64} -->
 */
export function createSerializer<T = unknown>(marker: string) {
  const prefix = `<!-- ${marker}`;

  function serialize(data: T): string {
    const json = JSON.stringify(data);
    const encoded = typeof btoa === "function" ? btoa(encodeURIComponent(json)) : "";
    return `\n${prefix}${encoded} -->`;
  }

  function deserialize(html: string): T | null {
    const idx = html.indexOf(prefix);
    if (idx === -1) return null;
    try {
      const start = idx + prefix.length;
      const end = html.indexOf(" -->", start);
      const encoded = html.substring(start, end);
      const json = decodeURIComponent(atob(encoded));
      return JSON.parse(json) as T;
    } catch {
      return null;
    }
  }

  return { serialize, deserialize };
}
