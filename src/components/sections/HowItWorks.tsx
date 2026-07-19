const STEPS = [
  {
    n: '01',
    title: 'See your weeks',
    body: 'Your whole life on one screen — every week you’ve lived, every week still ahead. It reads differently than a to-do list.',
  },
  {
    n: '02',
    title: 'Pick five habits',
    body: 'Goals, meditation, gratitude, exercise, fasting. Small, compounding, and chosen on purpose.',
  },
  {
    n: '03',
    title: 'Fill each week',
    body: 'Set intentions on Monday, reflect on Friday. Watch cold weeks turn warm.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-24 border-t border-white/5 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <h2 className="font-serif text-4xl tracking-tight text-white md:text-5xl">
          How it works
        </h2>
        <div className="mt-14 flex flex-col gap-12 md:flex-row md:gap-10">
          {STEPS.map((s) => (
            <div key={s.n} className="flex-1">
              <div className="font-serif text-xl italic text-warm/80">{s.n}</div>
              <h3 className="mt-3 text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-white/60">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
