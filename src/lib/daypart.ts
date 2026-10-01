export type Daypart = "morning" | "afternoon" | "evening" | "night";

/** Damascus local time (UTC+3) */
export function currentDaypart(d = new Date()): Daypart {
  const h = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Damascus" }).format(d),
  );
  if (h >= 6 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 22) return "evening";
  return "night";
}
