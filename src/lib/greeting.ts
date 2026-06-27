export const GATEKEEPER_DEFAULT_TIME_ZONE = "Asia/Kuching";

const MORNING_END_HOUR = 12;
const AFTERNOON_END_HOUR = 18;

function getHourInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone,
  }).formatToParts(date);

  const hourPart = parts.find((part) => part.type === "hour")?.value;
  const hour = Number(hourPart);

  return Number.isFinite(hour) ? hour : 0;
}

export function getTimeOfDayGreeting(
  date: Date = new Date(),
  timeZone: string = GATEKEEPER_DEFAULT_TIME_ZONE
) {
  const hour = getHourInTimeZone(date, timeZone);

  if (hour < MORNING_END_HOUR) {
    return "Good Morning";
  }

  if (hour < AFTERNOON_END_HOUR) {
    return "Good Afternoon";
  }

  return "Good Evening";
}