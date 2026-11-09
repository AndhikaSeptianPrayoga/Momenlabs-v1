/* MOMENLABS KIT — waktu & kalender acara (zona WIB) */

export const TZ = "Asia/Jakarta";

export const fmtTime = (iso) => new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: TZ });

const gcalStamp = (iso) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

// tautan "simpan ke Google Calendar" untuk satu acara
export function gcalLink(ev, couple) {
  return (
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent(`${ev.title} ${couple}`)}` +
    `&dates=${gcalStamp(ev.start)}/${gcalStamp(ev.end)}` +
    `&details=${encodeURIComponent(`Undangan ${ev.title} ${couple}`)}` +
    `&location=${encodeURIComponent(`${ev.venue}, ${ev.address}`)}`
  );
}
