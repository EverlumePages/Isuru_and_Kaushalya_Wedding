import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { wedding } from './data/wedding';
import assetDimensions from './data/asset-dimensions.json';
import { downloadCalendar, formatWeddingDate, mapLink, whatsappLink } from './lib/invitation';
import FloatingHearts from './components/FloatingHearts';
import InvitationOpening from './components/InvitationOpening';

const asset = (name: string) => `${import.meta.env.BASE_URL}assets/${name}.webp`;
const navigation = [
  ['The invitation', '#invitation'], ['When & where', '#details'],
  ['The day', '#programme'], ['Dress code', '#dress-code'],
] as const;

function Bilingual({ en, si }: { en: string; si: string }) {
  return <span className="bilingual"><span lang="en">{en}</span><span lang="si">{si}</span></span>;
}

function Icon({ name, className = '' }: { name: string; className?: string }) {
  const paths: Record<string, ReactNode> = {
    arrow: <><path d="M4 12h15m-5-5 5 5-5 5" /></>,
    diagonal: <><path d="M6 18 18 6M6 6h12v12" /></>,
    down: <><path d="M12 4v15m-5-5 5 5 5-5" /></>,
    calendar: <><rect x="4" y="5" width="16" height="16" rx="1" /><path d="M4 10h16M8 3v4m8-4v4m-8 7h2m4 0h2m-8 3h2" /></>,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z" /><circle cx="12" cy="10" r="2" /></>,
    rings: <><circle cx="8" cy="14" r="5.5" /><circle cx="16" cy="14" r="5.5" /><path d="m12 3 2.5 3L12 9 9.5 6 12 3Z" /></>,
    glasses: <><path d="m4 3 7 2-2 7c-1 3-6 1-5-2V3Zm16 0-7 2 2 7c1 3 6 1 5-2V3ZM7 14l-2 6m-3-1 6 2m9-7 2 6m-3 1 6-2M5 8l5 1m4 0 5-1" /></>,
    plate: <><circle cx="12" cy="13" r="6" /><circle cx="12" cy="13" r="3.8" /><path d="M2 3v8m-1-8v5h3V3M2 11v11M22 3v19m0-19c-3 1-3 9 0 9" /></>,
    stars: <><path d="m13 2 2 7 7 2-7 2-2 7-2-7-7-2 7-2 2-7Zm-8 13 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z" /></>,
    heart: <><path d="M20.8 4.8a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.4a5.5 5.5 0 0 0 0-7.8Z" /></>,
    whatsapp: <><path d="m4 17-1 4 4-1a9 9 0 1 0-3-3Z" /><path d="M8 7c-2 2 0 5 2 7s5 4 7 1l-3-2-1 1c-2-1-3-2-3-3l1-1-3-3Z" /></>,
    close: <><path d="m6 6 12 12M6 18 18 6" /></>,
  };
  return <svg className={`icon ${className}`} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.heart}</svg>;
}

function Decoration({ name, className = '', eager = false }: { name: string; className?: string; eager?: boolean }) {
  const dimensions = assetDimensions[name as keyof typeof assetDimensions];
  return <img className={`decoration ${className}`} src={asset(name)} {...dimensions} alt="" aria-hidden="true" loading={eager ? 'eager' : 'lazy'} decoding="async" draggable="false" />;
}

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const element = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = element.current;
    if (!node || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Only animate once; unsupported browsers and no-JS styles never hide content.
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        node.animate([{ opacity: 0, transform: 'translateY(22px)' }, { opacity: 1, transform: 'translateY(0)' }], {
          duration: 850, delay, easing: 'cubic-bezier(.2,.65,.3,1)', fill: 'backwards',
        });
        observer.disconnect();
      }
    }, { threshold: 0.12 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [delay]);
  return <div ref={element} className={className}>{children}</div>;
}

function SectionHeading({ eyebrow, title, script, light = false }: { eyebrow: string; title: string; script?: string; light?: boolean }) {
  return <div className={`section-heading ${light ? 'light' : ''}`}>
    <p className="eyebrow">{eyebrow}</p>
    <h2>{title}</h2>
    {script && <p className="script">{script}</p>}
  </div>;
}

function Header() {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    dialog.current?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  function closeMenu() {
    dialog.current?.close();
    setOpen(false);
    trigger.current?.focus();
  }

  return <header className="site-header">
    <a className="brand" href="#top" aria-label={`${wedding.names.join(' and ')}, back to top`}>
      <span className="monogram">{wedding.initials}</span>
      <span className="brand-label">A CELEBRATION OF LOVE</span>
    </a>
    <nav className="desktop-nav" aria-label="Main navigation">
      {navigation.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
    </nav>
    <a className="header-rsvp" href="#rsvp"><Bilingual en="Kindly RSVP" si="පැමිණීම දන්වන්න" /> <Icon name="diagonal" /></a>
    <button ref={trigger} className="menu-toggle" aria-label="Open navigation" aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(true)}><span /><span /></button>
    <dialog id="mobile-navigation" className="mobile-menu" ref={dialog} onCancel={event => { event.preventDefault(); closeMenu(); }} onClick={event => { if (event.target === event.currentTarget) closeMenu(); }} onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const items = event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }} aria-label="Navigation">
      <div className="mobile-menu-inner">
        <div className="menu-top"><span className="monogram">{wedding.initials}</span><button className="icon-button" onClick={closeMenu} aria-label="Close navigation"><Icon name="close" /></button></div>
        <p className="eyebrow">OUR WEDDING DAY</p>
        <nav aria-label="Mobile navigation">{[...navigation, ['Kindly RSVP', '#rsvp']].map(([label, href], index) => <a key={href} href={href} onClick={closeMenu}><span>0{index + 1}</span>{label}<Icon name="diagonal" /></a>)}</nav>
        <p className="script">With love, {wedding.names.join(' & ')}</p>
      </div>
    </dialog>
  </header>;
}

function Hero() {
  return <section className="hero" aria-labelledby="hero-title">
    <Decoration name="pearl-left" className="hero-pearl-left" eager />
    <div className="hero-copy">
      <p className="eyebrow hero-enter">TOGETHER IS A BEAUTIFUL PLACE TO BE</p>
      <h1 id="hero-title" className="hero-enter"><span>{wedding.names[0]}</span><span className="ampersand">&</span><span>{wedding.names[1]}</span></h1>
      <p className="script hero-script hero-enter">Our wedding day</p>
      <div className="hero-date hero-enter"><span>{String(wedding.date.day).padStart(2, '0')}</span><i /><span>{String(wedding.date.month).padStart(2, '0')}</span><i /><span>{wedding.date.year}</span></div>
      <p className="eyebrow hero-place hero-enter">{wedding.location}</p>
      <a href="#invitation" className="discover hero-enter"><span className="discover-arrow"><Icon name="down" /></span><Bilingual en="Our invitation to you" si="අපේ ආරාධනාව" /></a>
    </div>
    <div className="hero-image-wrap hero-enter">
      <div className="hero-image-border"><img className="hero-image" src={asset('couple')} srcSet={`${asset('couple-small')} 640w, ${asset('couple')} 1100w`} sizes="(max-width: 767px) 92vw, (max-width: 1199px) 45vw, 485px" alt={`${wedding.names.join(' and ')} sharing a quiet moment together`} fetchPriority="high" width="1100" height="816" /></div>
      <Decoration name="pearl-right" className="hero-pearl-right" eager />
      <span className="photo-caption">a lifetime of us.</span>
    </div>
    <div className="hero-bottom"><span>ONE DAY. ONE LOVE. A LIFETIME.</span><span>EST. {wedding.date.year} <Icon name="heart" /></span></div>
  </section>;
}

function Invitation() {
  return <section id="invitation" className="invitation section-space" aria-labelledby="invitation-title">
    <Reveal className="invitation-copy">
      <p className="eyebrow">YOU ARE OUR FAVOURITE PEOPLE</p>
      <h2 id="invitation-title">{wedding.invitation.greeting}</h2>
      <p className="script">You’re invited</p>
      <p className="intro-line si-copy" lang="si">{wedding.invitation.message}</p>
      <p className="si-copy" lang="si">{wedding.invitation.body}</p>
      <div className="little-flourish" aria-hidden="true"><span /><Icon name="heart" /><span /></div>
    </Reveal>
    <Reveal className="invitation-art" delay={120}>
      <Decoration name="letter" className="letter-image" />
      <div className="letter-copy"><span className="eyebrow">A LITTLE NOTE FOR YOU</span><p lang="si">{wedding.invitation.closing}</p><span className="script">With all our love,</span><span className="letter-signature">{wedding.names.join(' & ')}</span></div>
      <Decoration name="pearl-garland" className="letter-pearls" />
    </Reveal>
  </section>;
}

function DateSection() {
  const { year, month, day } = wedding.date;
  const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, day)));
  return <section id="details" className="date-section section-space">
    <Reveal><SectionHeading eyebrow="A DATE TO HOLD CLOSE" title="Save the date" script="The beginning of forever" /></Reveal>
    <Reveal className="calendar-composition">
      <div className="calendar-month"><span>{monthLabel}</span><span>{year}</span></div>
      <div className="date-strip">
        {[-2, -1, 0, 1, 2].map(offset => {
          const date = new Date(Date.UTC(year, month - 1, day + offset));
          const weekday = new Intl.DateTimeFormat('en', { weekday: 'short', timeZone: 'UTC' }).format(date);
          return <div className={`calendar-day ${offset === 0 ? 'selected' : ''}`} key={offset} aria-label={`${weekday} ${date.getUTCDate()}${offset === 0 ? ', our wedding day' : ''}`}>
            <span className="day-label">{weekday}</span><span className="day-number">{date.getUTCDate()}</span>{offset === 0 && <Icon name="heart" />}
          </div>;
        })}
      </div>
      <Decoration name="pendant" className="calendar-pendant" />
    </Reveal>
    <Reveal className="calendar-action"><p>Friday, {formatWeddingDate()} <span>·</span> {wedding.location}</p><button className="text-link" onClick={downloadCalendar}><Icon name="calendar" /><Bilingual en="Add to my calendar" si="දින දර්ශනයට එක් කරන්න" /><Icon name="diagonal" /></button></Reveal>
  </section>;
}

function Venues() {
  return <section id="venues" className="venues section-space">
    <Reveal><SectionHeading eyebrow="CELEBRATE WITH US" title="A place for our forever" script="Somewhere beautiful" /></Reveal>
    <div className="venue-layout">
      <Reveal className="venue-art">
        <Decoration name="venue-frame" className="venue-frame" />
        <div className="venue-frame-copy"><span className="eyebrow">A SRI LANKAN LOVE STORY</span><span className="script">Sri Lanka</span><span className="venue-frame-line" /><span className="venue-frame-date">{formatWeddingDate()}</span><span className="monogram">{wedding.initials}</span></div>
        <Decoration name="pearl-drape" className="venue-pearls" />
      </Reveal>
      <div className="venue-cards">
        {wedding.venues.map((venue, i) => <Reveal className="venue-card" key={venue.name} delay={i * 120}>
          <div className="venue-label"><span className="eyebrow">0{i + 1} / {venue.kind}</span><span className="venue-time">{venue.time}</span></div>
          <h3>{venue.name}</h3><address>{venue.address}<br />{venue.city}</address>
          <a className="text-link" href={mapLink(venue)} target="_blank" rel="noopener noreferrer"><Icon name="pin" /><Bilingual en="View on map" si="සිතියම බලන්න" /><span className="visually-hidden"> — {venue.name} on Google Maps (opens in a new tab)</span><Icon name="diagonal" /></a>
        </Reveal>)}
      </div>
    </div>
  </section>;
}

function Programme() {
  return <section id="programme" className="programme section-space">
    <Reveal><SectionHeading eyebrow="EVERY MOMENT, TOGETHER" title="The programme" script="A day to remember" light /></Reveal>
    <div className="programme-content">
      <Decoration name="necklace" className="programme-necklace" />
      {wedding.programme.map((event, index) => <Reveal className={`programme-event event-${index + 1}`} key={event.time} delay={index * 80}>
        <Icon name={event.icon} /><span className="event-time">{event.time}</span><h3>{event.title}</h3><p lang="si">{event.detail}</p>
      </Reveal>)}
    </div>
    <p className="programme-note" lang="si">සිනහවෙන්, සතුටින් හා ආදරයෙන් පිරුණු දවසක්.</p>
  </section>;
}

function DressCode() {
  return <section id="dress-code" className="dress-code section-space">
    <Reveal><SectionHeading eyebrow="DRESSED IN LOVE" title="A little inspiration" script="The dress code" /><p className="section-description" lang="si">අපේ මංගල දිනයේ වර්ණ එකතුවට ගැළපෙන,<br className="desktop-break" /> ඔබට පහසු සුන්දර ඇඳුමකින් සැරසී එන්න.</p></Reveal>
    <Reveal className="palette">
      {wedding.palette.map((colour, i) => <figure className="swatch" key={colour.name} style={{ '--swatch-delay': `${i * 65}ms` } as CSSProperties}><img src={asset(colour.asset)} width="160" height="160" alt="" loading="lazy" /><figcaption>{colour.name}</figcaption></figure>)}
    </Reveal>
    <Reveal><div className="dress-note"><span className="tiny-star" aria-hidden="true">✧</span><p lang="si">ඔබට ගැළපෙන සරල, අලංකාර ඇඳුමක් තෝරාගන්න.<br />සුදු සහ ඇත්දළ පැහැයන් මනාලිය වෙනුවෙන් වෙන් කරමු.</p></div></Reveal>
  </section>;
}

function RsvpSection() {
  const [attendance, setAttendance] = useState('');
  const [error, setError] = useState('');
  const [preparedLink, setPreparedLink] = useState('');
  const [handoff, setHandoff] = useState(false);
  const form = useRef<HTMLFormElement>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') || '').trim();
    const guests = attendance === 'yes' ? Number(data.get('guests')) : 0;
    if (!name) { setError('කරුණාකර ඔබේ නම ඇතුළත් කරන්න.'); form.current?.querySelector<HTMLInputElement>('#guest-name')?.focus(); return; }
    if (attendance !== 'yes' && attendance !== 'no') { setError('ඔබට සහභාගී විය හැකිදැයි තෝරන්න.'); return; }
    if (attendance === 'yes' && (!Number.isSafeInteger(guests) || guests < 1)) { setError('ඔබත් ඇතුළුව පැමිණෙන අමුත්තන් ගණන ඇතුළත් කරන්න.'); return; }
    const url = whatsappLink({ name, attendance, guests, message: String(data.get('message') || '') });
    setPreparedLink(url);
    setHandoff(true);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return <section id="rsvp" className="rsvp-section section-space">
    <Reveal className="rsvp-intro"><SectionHeading eyebrow="THE DAY IS BETTER WITH YOU" title="Will you join us?" script="Kindly RSVP" /><p lang="si">ඔබත් අප සමඟ එක්වනවා නම් අපට මහත් සතුටක්.<br />ඔබේ පැමිණීම ගැන පහතින් දන්වන්න.</p><div className="rsvp-envelope"><Decoration name="envelope" /><div className="envelope-copy"><span className="monogram">{wedding.initials}</span><span lang="si">අපේ ආදරණීය<br />ඔබ වෙනුවෙන්.</span><Icon name="heart" /></div></div></Reveal>
    <Reveal className="rsvp-form-wrap" delay={100}>
      <form className="rsvp-form" ref={form} onSubmit={submit} onChange={() => {
        setHandoff(false);
        setError('');
        form.current?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea').forEach(field => field.setCustomValidity(''));
      }} onInvalidCapture={event => {
        const field = event.target;
        if (!(field instanceof HTMLInputElement)) return;
        const messages: Record<string, string> = {
          name: 'කරුණාකර ඔබේ නම ඇතුළත් කරන්න.',
          attendance: 'ඔබට සහභාගී විය හැකිදැයි තෝරන්න.',
          guests: 'ඔබත් ඇතුළුව පැමිණෙන අමුත්තන් ගණන පූර්ණ සංඛ්‍යාවක් ලෙස ඇතුළත් කරන්න (අවම 1).',
        };
        if (messages[field.name]) field.setCustomValidity(messages[field.name]);
      }}>
        <div className="form-heading"><span className="eyebrow">A REPLY, WITH LOVE</span><Icon name="heart" /></div>
        <div className="field"><label htmlFor="guest-name"><Bilingual en="Your full name" si="ඔබේ සම්පූර්ණ නම" /> <span>*</span></label><input id="guest-name" name="name" lang="si" autoComplete="name" placeholder="ඔබේ නම මෙහි ලියන්න" required maxLength={150} /></div>
        <fieldset className="attendance-field"><legend><Bilingual en="Will you be celebrating with us?" si="ඔබ අප සමඟ එක්වනවාද?" /> <span>*</span></legend><div className="attendance-options"><label className={attendance === 'yes' ? 'chosen' : ''}><input type="radio" name="attendance" value="yes" checked={attendance === 'yes'} onChange={() => setAttendance('yes')} required /><Bilingual en="Joyfully accept" si="සතුටින් එන්නම්" /><Icon name="heart" /></label><label className={attendance === 'no' ? 'chosen' : ''}><input type="radio" name="attendance" value="no" checked={attendance === 'no'} onChange={() => setAttendance('no')} required /><Bilingual en="Regretfully decline" si="පැමිණිය නොහැක" /></label></div></fieldset>
        {attendance === 'yes' && <div className="field guests-field"><label htmlFor="guest-count"><Bilingual en="Number of guests" si="අමුත්තන් ගණන" /> <span>*</span></label><div className="guest-count-row"><input id="guest-count" name="guests" type="number" inputMode="numeric" min="1" step="1" defaultValue="1" required /><Bilingual en="Including yourself" si="ඔබත් ඇතුළුව" /></div></div>}
        <div className="field"><label htmlFor="guest-message"><Bilingual en="A note for the couple" si="අපට පණිවිඩයක්" /> <span className="optional" lang="si">කැමති නම්</span></label><textarea id="guest-message" name="message" lang="si" rows={3} maxLength={1000} placeholder="සුබ පැතුමක්, ආහාර අවශ්‍යතාවක් හෝ ඔබ කැමති ගීතයක්…" /></div>
        {error && <p className="form-error" role="alert" lang="si">{error}</p>}
        <button type="submit" className="button primary-button"><Icon name="whatsapp" /><Bilingual en="Send RSVP via WhatsApp" si="පැමිණීම දන්වන්න" /><Icon name="diagonal" /></button>
        <p className="form-note" lang="si">ඔබේ පිළිතුර WhatsApp තුළ විවෘත වේ. එහි <span lang="en">Send</span> ඔබා යවන්න.<br />මෙම වෙබ් අඩවියෙන් පිළිතුරු යැවීම හෝ ගබඩා කිරීම සිදු නොවේ.</p>
        {handoff && <div className="handoff-message" role="status"><p lang="si">ඔබේ පණිවිඩය සූදානම්. WhatsApp තුළ <span lang="en">Send</span> ඔබා යවන්න.</p><a href={preparedLink} target="_blank" rel="noopener noreferrer"><Bilingual en="Open WhatsApp again" si="නැවත විවෘත කරන්න" /><Icon name="diagonal" /></a></div>}
      </form>
    </Reveal>
  </section>;
}

function Wishes() {
  return <section className="wishes section-space">
    <Reveal><p className="eyebrow">YOUR PRESENCE IS OUR PRESENT</p><h2>A little wish</h2><Decoration name="pearl-hearts" className="wishes-hearts" /><p className="wishes-text" lang="si">{wedding.wishes}</p><p className="script">All we really need is you.</p></Reveal>
  </section>;
}

export default function App() {
  return <>
    <InvitationOpening />
    <a className="skip-link" href="#main"><Bilingual en="Skip to invitation" si="ආරාධනාව වෙත යන්න" /></a>
    <FloatingHearts />
    <div className="site-shell" id="top">
      <Header />
      <main id="main"><Hero /><Invitation /><DateSection /><Venues /><Programme /><DressCode /><RsvpSection /><Wishes /></main>
      <footer className="footer"><a className="footer-monogram monogram" href="#top" aria-label="Back to top">{wedding.initials}</a><p className="script">See you, with love</p><div className="footer-meta"><span>{wedding.names.join(' & ')} · {formatWeddingDate()}</span><span>MADE WITH LOVE <Icon name="heart" /></span><a href="#top"><Bilingual en="Back to top" si="ඉහළට යන්න" /><Icon name="down" /></a></div></footer>
    </div>
  </>;
}
