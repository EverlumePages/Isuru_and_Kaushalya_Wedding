import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { wedding } from '../data/wedding';
import { formatWeddingDate } from '../lib/invitation';
import openingVideo from '../../petals/invitation_open.mp4?url';
import invitationCard from '../../petals/invitation_card.jpeg?url';
import '../opening.css';

type Phase = 'video' | 'revealing' | 'ready';

export default function InvitationOpening() {
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [phase, setPhase] = useState<Phase>(() => reducedMotion ? 'ready' : 'video');
  const [needsPlay, setNeedsPlay] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const asset = (name: string) => `${import.meta.env.BASE_URL}assets/${name}.webp`;

  const revealCard = useCallback(() => {
    setPhase(current => current === 'video' ? (reducedMotion ? 'ready' : 'revealing') : current);
  }, [reducedMotion]);

  useLayoutEffect(() => {
    if (dismissed) return;
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element?.showModal();
    element?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = previousOverflow;
      element?.close();
    };
  }, [dismissed]);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => {
      setReducedMotion(preference.matches);
      if (preference.matches) setPhase('ready');
    };
    preference.addEventListener('change', onChange);
    return () => preference.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const clip = video.current;
    if (phase !== 'video' || reducedMotion || dismissed || leaving) {
      clip?.pause();
      return;
    }
    let active = true;
    // Muted inline playback works on mobile; offer a tap if the browser blocks it.
    clip?.play().catch(() => { if (active) setNeedsPlay(true); });
    // A failed or stalled download must never leave guests stuck at the envelope.
    let fallback = window.setTimeout(revealCard, 12000);
    const onProgress = () => {
      window.clearTimeout(fallback);
      fallback = window.setTimeout(revealCard, 12000);
    };
    clip?.addEventListener('timeupdate', onProgress);
    return () => {
      active = false;
      window.clearTimeout(fallback);
      clip?.removeEventListener('timeupdate', onProgress);
    };
  }, [phase, reducedMotion, dismissed, leaving, revealCard]);

  useEffect(() => {
    if (!leaving) return;
    const timeout = window.setTimeout(() => {
      dialog.current?.close();
      setDismissed(true);
      document.querySelector<HTMLAnchorElement>('.brand')?.focus({ preventScroll: true });
    }, reducedMotion ? 0 : 650);
    return () => window.clearTimeout(timeout);
  }, [leaving, reducedMotion]);

  function enterInvitation() {
    video.current?.pause();
    setLeaving(true);
  }

  if (dismissed) return null;

  return <dialog
    ref={dialog}
    className="invitation-opening"
    data-phase={phase}
    data-leaving={leaving}
    aria-label="A wedding invitation for you"
    tabIndex={-1}
    onCancel={event => { event.preventDefault(); enterInvitation(); }}
  >
    <div className="opening-backdrop" aria-hidden="true">
      <img className="opening-still" src={asset('invitation-opening-still')} alt="" width="576" height="1024" />
      {!reducedMotion && <video
        ref={video}
        className="opening-video"
        src={openingVideo}
        poster={asset('invitation-opening-poster')}
        autoPlay
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        onEnded={revealCard}
        onError={revealCard}
        onPlaying={() => setNeedsPlay(false)}
      />}
    </div>

    <div className="opening-topline">
      <span className="opening-dedication">WITH LOVE, FOR YOU</span>
      <button className="opening-skip" type="button" onClick={enterInvitation}>Skip intro <span aria-hidden="true">↗</span></button>
    </div>

    <div className="opening-stage">
      <div
        className="opening-card-motion"
        aria-hidden={phase === 'video'}
        onAnimationEnd={event => {
          if (event.target === event.currentTarget && event.animationName === 'opening-card-rise') {
            setPhase(current => current === 'revealing' ? 'ready' : current);
          }
        }}
      >
        <div className="opening-card">
          <div className="opening-card-face opening-card-front">
            <img src={invitationCard} alt="" width="736" height="1104" draggable="false" />
            <div className="opening-card-copy">
              <p className="opening-card-eyebrow">Together with our families</p>
              <p className="opening-card-script">You're invited</p>
              <h2 className="opening-card-names"><span>{wedding.names[0]}</span><span className="opening-ampersand">&</span><span>{wedding.names[1]}</span></h2>
              <span className="opening-card-rule" aria-hidden="true" />
              <p className="opening-card-message">With full hearts, we invite you<br />to share in the joy of our wedding.</p>
              <div className="opening-card-details"><p>{formatWeddingDate()}</p><p>{wedding.location}</p></div>
              <p className="opening-card-closing">Our forever begins with you.</p>
            </div>
          </div>
          <div className="opening-card-face opening-card-back" aria-hidden="true">
            <img src={invitationCard} alt="" width="736" height="1104" draggable="false" />
            <div className="opening-card-back-copy"><span>With love</span><span>{wedding.initials}</span><span>A beautiful beginning</span></div>
          </div>
        </div>
      </div>
    </div>

    <div className="opening-actions">
      {phase === 'video' && (needsPlay
        ? <button className="opening-continue" type="button" onClick={() => {
          video.current?.play().catch(revealCard);
        }}>Open the envelope <span aria-hidden="true">↗</span></button>
        : <p className="opening-waiting">A beautiful beginning<span aria-hidden="true">…</span></p>)}
      {phase === 'revealing' && <p className="opening-waiting" role="status">A little invitation, a lifetime of love.</p>}
      {phase === 'ready' && <button className="opening-continue" type="button" onClick={enterInvitation}>View our invitation <span aria-hidden="true">↗</span></button>}
    </div>
  </dialog>;
}
