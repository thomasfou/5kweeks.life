import { useState } from 'react';
import Logo from './Logo';
import MobileMenu from './MobileMenu';

export const NAV_LINKS = [
  { label: 'How it works', href: '#how' },
  { label: 'Five habits', href: '#habits' },
  { label: 'Science', href: '#science' },
  { label: 'Get the app', href: '#download' },
] as const;

export default function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        <nav
          aria-label="Main"
          className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8"
        >
          <Logo />
          <div className="liquid-glass hidden items-center rounded-full p-1.5 md:flex">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-full px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </a>
            ))}
          </div>
          <a
            href="#download"
            className="liquid-glass hidden min-h-[44px] items-center gap-2.5 rounded-full px-5 text-sm font-medium text-white md:flex"
          >
            <span className="dot-live" aria-hidden="true" />
            Get the app
          </a>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="liquid-glass flex h-11 w-11 items-center justify-center rounded-full text-white md:hidden"
          >
            <span className="sr-only">Open menu</span>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M1 4h16M1 9h16M1 14h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </nav>
      </header>
      {open && <MobileMenu onClose={() => setOpen(false)} />}
    </>
  );
}
