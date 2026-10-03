import { useEffect, useState, type CSSProperties } from 'react';

// Fixed seeds keep the animation steady when the form or menu rerenders.
// The first six span the whole viewport and are the only ones shown on phones.
const hearts = [
  { left: 5, size: 25, duration: 25, delay: -8, opacity: .28, drift: 18, rotation: -12 },
  { left: 23, size: 33, duration: 29, delay: -22, opacity: .34, drift: -20, rotation: 10 },
  { left: 42, size: 22, duration: 22, delay: -12, opacity: .24, drift: 24, rotation: -8 },
  { left: 60, size: 30, duration: 27, delay: -3, opacity: .32, drift: -16, rotation: 14 },
  { left: 78, size: 26, duration: 24, delay: -17, opacity: .30, drift: 20, rotation: -16 },
  { left: 94, size: 36, duration: 30, delay: -11, opacity: .38, drift: -25, rotation: 8 },
  { left: 14, size: 20, duration: 18, delay: -14, opacity: .22, drift: -12, rotation: 18 },
  { left: 32, size: 28, duration: 26, delay: -6, opacity: .29, drift: 22, rotation: -10 },
  { left: 51, size: 38, duration: 28, delay: -20, opacity: .40, drift: -18, rotation: 12 },
  { left: 69, size: 24, duration: 23, delay: -10, opacity: .26, drift: 15, rotation: -14 },
  { left: 85, size: 31, duration: 21, delay: -19, opacity: .33, drift: -24, rotation: 9 },
  { left: 98, size: 21, duration: 20, delay: -5, opacity: .23, drift: -28, rotation: -9 },
] as const;

export default function FloatingHearts() {
  const [paused, setPaused] = useState(() => document.hidden);

  useEffect(() => {
    const updateVisibility = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);

  return <div className="floating-hearts" aria-hidden="true" data-paused={paused}>
    {hearts.map((heart, index) => <span className="floating-heart" key={index} style={{
      '--heart-left': `${heart.left}%`,
      '--heart-size': `${heart.size}px`,
      '--heart-duration': `${heart.duration}s`,
      '--heart-delay': `${heart.delay}s`,
      '--heart-opacity': heart.opacity,
      '--heart-drift': `${heart.drift}px`,
      '--heart-rotation': `${heart.rotation}deg`,
    } as CSSProperties}>
      <img src={`${import.meta.env.BASE_URL}assets/pearlheart.webp`} alt="" width="128" height="113" decoding="async" draggable="false" />
    </span>)}
  </div>;
}
