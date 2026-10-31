export type Tone = "yellow" | "pink" | "green" | "blue" | "lilac" | "peach";

type ToneStyle = {
  /** Full-strength sticker fill: cards, active chips, avatars */
  fill: string;
  /** Tinted background for quieter tags and table rows */
  soft: string;
  /** Solid fill only, e.g. timeline dots */
  solid: string;
};

// Full class strings (never interpolated) so Tailwind can detect them.
// Ink text passes 4.5:1 on every fill and tint below.
export const toneStyles: Record<Tone, ToneStyle> = {
  yellow: { fill: "bg-pastel-yellow text-ink", soft: "bg-pastel-yellow/35 text-ink", solid: "bg-pastel-yellow" },
  pink: { fill: "bg-pastel-pink text-ink", soft: "bg-pastel-pink/40 text-ink", solid: "bg-pastel-pink" },
  green: { fill: "bg-pastel-green text-ink", soft: "bg-pastel-green/35 text-ink", solid: "bg-pastel-green" },
  blue: { fill: "bg-pastel-blue text-ink", soft: "bg-pastel-blue/35 text-ink", solid: "bg-pastel-blue" },
  lilac: { fill: "bg-pastel-lilac text-ink", soft: "bg-pastel-lilac/40 text-ink", solid: "bg-pastel-lilac" },
  peach: { fill: "bg-pastel-peach text-ink", soft: "bg-pastel-peach/40 text-ink", solid: "bg-pastel-peach" },
};

export const TONES: Tone[] = ["yellow", "pink", "green", "blue", "lilac", "peach"];

/** Stable tone for a name, so a person's avatar colour never changes. */
export function toneFor(name: string): Tone {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return TONES[hash % TONES.length]!;
}
