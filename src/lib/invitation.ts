import { wedding } from '../data/wedding';

export type Rsvp = {
  name: string;
  attendance: 'yes' | 'no';
  guests: number;
  message: string;
};

export function whatsappLink(response: Rsvp): string {
  const message = [
    `Hello ${wedding.names.join(' & ')}!`,
    `Name / නම: ${response.name.trim()}`,
    `Wedding date / දිනය: ${formatWeddingDate()}`,
    response.attendance === 'yes'
      ? `Joyfully accept / සතුටින් සහභාගී වෙමි.\nGuests (including me) / මා ඇතුළු අමුත්තන්: ${response.guests}`
      : 'Regretfully decline / කනගාටුයි, මට සහභාගී වීමට නොහැක. ඔබ දෙපළට සුබ පැතුම්!',
    response.message.trim(),
  ].filter(Boolean).join('\n\n');
  return `https://wa.me/${wedding.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
}

export function formatWeddingDate(): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(wedding.date.year, wedding.date.month - 1, wedding.date.day)));
}

export function mapLink(venue: typeof wedding.venues[number]): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.name}, ${venue.address}, ${venue.city}`)}`;
}

// Resolve the venue's wall-clock time to UTC, so calendar imports remain correct
// for guests in other countries and for dates in either standard or summer time.
function localToUtc(local: string, timeZone: string): string {
  const wallClock = Date.parse(`${local}Z`);
  let utc = wallClock;
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  });
  for (let i = 0; i < 3; i++) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(utc)).map(part => [part.type, part.value]));
    const represented = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
    utc += wallClock - represented;
  }
  return new Date(utc).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

const escapeIcs = (value: string) => value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

function foldLine(line: string): string {
  const encoder = new TextEncoder();
  let result = '';
  let byteCount = 0;
  for (const character of line) {
    const size = encoder.encode(character).length;
    if (byteCount + size > 75) { result += '\r\n '; byteCount = 1; }
    result += character;
    byteCount += size;
  }
  return result;
}

export function calendarContent(): string {
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Pearl and Paper//Wedding Invitation//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
    `UID:${wedding.date.year}${wedding.date.month}${wedding.date.day}-${wedding.initials.toLowerCase()}@pearl-and-paper.local`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    `DTSTART:${localToUtc(wedding.start, wedding.timezone)}`,
    `DTEND:${localToUtc(wedding.end, wedding.timezone)}`,
    `SUMMARY:${escapeIcs(`${wedding.names.join(' & ')} — Wedding day`)}`,
    `LOCATION:${escapeIcs(`${wedding.venues[0].name}, ${wedding.venues[0].address}, ${wedding.venues[0].city}`)}`,
    `DESCRIPTION:${escapeIcs(`Join us for our wedding in ${wedding.location}. Ceremony at ${wedding.venues[0].name}. All programme times are local to ${wedding.timezone}.`)}`,
    'END:VEVENT', 'END:VCALENDAR', '',
  ].map(foldLine).join('\r\n');
}

export function downloadCalendar(): void {
  const url = URL.createObjectURL(new Blob([calendarContent()], { type: 'text/calendar;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${wedding.names.join('-').toLowerCase()}-wedding.ics`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
