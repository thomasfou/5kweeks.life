import { useEffect } from 'react';
import { NAV_LINKS } from './Nav';

interface Props {
  onClose: () => void;
}

/**
 * Fullscreen #050507 menu. Items slide up with a +60ms stagger from 100ms
 * (cubic-bezier(0.77,0,0.18,1)); the close button rotates in from -90°.
 * Body scroll is locked while open. Reduced-motion skips all of it (CSS).
 */
export default function MobileMenu({ onClose }: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className="fixed inset-0 z-[60] flex flex-col bg-[#050507]"
    >
      <div className="flex items-center justify-between px-5 py-4">
        <span className="text-[17px] font-semibold text-white">5k Weeks</span>
        <button
          type="button"
          onClick={onClose}
          className="menu-close liquid-glass flex h-11 w-11 items-center justify-center rounded-full text-white"
        >
          <span className="sr-only">Close menu</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <nav aria-label="Mobile" className="flex flex-1 flex-col justify-center gap-1 px-8">
        {NAV_LINKS.map((l, i) => (
          <a
            key={l.href}
            href={l.href}
            onClick={onClose}
            className="menu-item py-3 font-serif text-4xl text-white/90"
            style={{ animationDelay: `${100 + i * 60}ms` }}
          >
            {l.label}
          </a>
        ))}
      </nav>
      <div
        className="menu-item px-8 pb-12"
        style={{ animationDelay: `${100 + NAV_LINKS.length * 60}ms` }}
      >
        <span className="flex items-center gap-2.5 text-sm text-white/60">
          <span className="dot-live" aria-hidden="true" />
          Coming soon to the App Store &amp; Google Play
        </span>
      </div>
    </div>
  );
}
