export type UsageLevel = "normal" | "warning" | "critical";

export function getUsageLevel(remainingPercent: number): UsageLevel {
  if (remainingPercent < 20) return "critical";
  if (remainingPercent <= 50) return "warning";
  return "normal";
}
