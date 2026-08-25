/**
 * Contrast helpers for user-authored colours.
 *
 * Bio pages let people pick their own background, text and accent colours. The
 * editor cannot forbid a combination, but it can warn before someone publishes
 * a page nobody can read.
 */

function parseHex(value: string): [number, number, number] | null {
  const hex = value.trim().replace(/^#/, "");
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function channelLuminance(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

/**
 * WCAG contrast ratio between two hex colours, or `null` when either colour
 * cannot be parsed (a gradient, an image, a CSS keyword).
 */
export function contrastRatio(
  foreground: string,
  background: string,
): number | null {
  const fg = parseHex(foreground);
  const bg = parseHex(background);
  if (!fg || !bg) return null;
  const lf = relativeLuminance(fg);
  const lb = relativeLuminance(bg);
  const [lighter, darker] = lf > lb ? [lf, lb] : [lb, lf];
  return (lighter + 0.05) / (darker + 0.05);
}

export type ContrastVerdict = "good" | "low" | "unreadable" | "unknown";

export function contrastVerdict(
  foreground: string,
  background: string,
): { verdict: ContrastVerdict; ratio: number | null } {
  const ratio = contrastRatio(foreground, background);
  if (ratio === null) return { verdict: "unknown", ratio: null };
  if (ratio >= 4.5) return { verdict: "good", ratio };
  if (ratio >= 3) return { verdict: "low", ratio };
  return { verdict: "unreadable", ratio };
}
