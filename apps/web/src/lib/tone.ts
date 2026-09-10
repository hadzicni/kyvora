/**
 * Status tones are the only colour vocabulary the product uses for meaning.
 * A tone resolves to a `--tone` custom property in globals.css, so badges,
 * bars, tiles and icons stay in sync without repeating raw palette values.
 */
export type Tone = "brand" | "success" | "warning" | "danger" | "info" | "neutral"

const toneClasses: Record<Tone, string> = {
  brand: "tone-brand",
  success: "tone-success",
  warning: "tone-warning",
  danger: "tone-danger",
  info: "tone-info",
  neutral: "tone-neutral",
}

export function toneClass(tone: Tone) {
  return toneClasses[tone]
}

/** Tone used by every ONLINE / OFFLINE / UNKNOWN indicator in the product. */
export function statusTone(status: "ONLINE" | "OFFLINE" | "UNKNOWN"): Tone {
  switch (status) {
    case "ONLINE":
      return "success"
    case "OFFLINE":
      return "danger"
    case "UNKNOWN":
      return "warning"
  }
}
