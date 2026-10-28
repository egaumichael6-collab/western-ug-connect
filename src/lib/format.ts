const tz = "Africa/Kampala";

export const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: tz }) : "—";

export const fmtDateTime = (d?: string | null) =>
  d
    ? new Date(d).toLocaleString("en-GB", {
        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: tz,
      })
    : "—";

export const fmtTime = (d: string) =>
  new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz });

export function timeAgo(d?: string | null) {
  if (!d) return "";
  const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)} d ago`;
  return fmtDate(d);
}

export function ageFromDob(dob: string) {
  const b = new Date(dob + "T00:00:00");
  const n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  const m = n.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < b.getDate())) a--;
  return a;
}

export function daysLeft(iso: string) {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}
