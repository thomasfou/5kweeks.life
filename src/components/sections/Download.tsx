import StoreButtons from '../StoreButtons';

export default function Download() {
  return (
    <section id="download" className="scroll-mt-24 border-t border-white/5 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="flex flex-col items-center text-center">
          <h2 className="font-serif text-4xl tracking-tight text-white md:text-5xl">
            Make the next week count.
          </h2>
          <p className="mt-4 max-w-md text-base text-white/60">
            5k Weeks is coming to iPhone and Android.
          </p>
          <div className="mt-9 flex justify-center">
            <StoreButtons />
          </div>
        </div>
        <footer className="mt-24 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-sm text-white/40 sm:flex-row">
          <span>© {new Date().getFullYear()} 5k Weeks</span>
          <span className="flex gap-5">
            <a href="/privacy.html" className="text-white/40 hover:text-white/70">
              Privacy
            </a>
            <a href="/terms.html" className="text-white/40 hover:text-white/70">
              Terms
            </a>
            <a href="mailto:team@5kweeks.life" className="text-white/40 hover:text-white/70">
              Contact
            </a>
          </span>
        </footer>
      </div>
    </section>
  );
}
